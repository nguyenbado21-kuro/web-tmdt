<?php

namespace Botble\OnePay\Providers;

use Botble\Payment\Enums\PaymentMethodEnum;
use Botble\Payment\Enums\PaymentStatusEnum;
use Botble\OnePay\Services\Gateways\OnePayPaymentService;
use Exception;
use Html;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;

class HookServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        add_filter(PAYMENT_FILTER_ADDITIONAL_PAYMENT_METHODS, [$this, 'registerOnePayMethod'], 11, 2);
        add_filter(PAYMENT_FILTER_AFTER_POST_CHECKOUT, [$this, 'checkoutWithOnePay'], 11, 2);

        add_filter(PAYMENT_METHODS_SETTINGS_PAGE, [$this, 'addPaymentSettings'], 93);

        add_filter(BASE_FILTER_ENUM_ARRAY, function ($values, $class) {
            if ($class == PaymentMethodEnum::class) {
                $values['ONEPAY'] = ONEPAY_PAYMENT_METHOD_NAME;
            }

            return $values;
        }, 20, 2);

        add_filter(BASE_FILTER_ENUM_LABEL, function ($value, $class) {
            if ($class == PaymentMethodEnum::class && $value == ONEPAY_PAYMENT_METHOD_NAME) {
                $value = 'OnePay';
            }

            return $value;
        }, 20, 2);

        add_filter(BASE_FILTER_ENUM_HTML, function ($value, $class) {
            if ($class == PaymentMethodEnum::class && $value == ONEPAY_PAYMENT_METHOD_NAME) {
                $value = Html::tag(
                    'span',
                    PaymentMethodEnum::getLabel($value),
                    ['class' => 'label-success status-label']
                )
                    ->toHtml();
            }

            return $value;
        }, 20, 2);

        add_filter(PAYMENT_FILTER_GET_SERVICE_CLASS, function ($data, $value) {
            if ($value == ONEPAY_PAYMENT_METHOD_NAME) {
                $data = OnePayPaymentService::class;
            }

            return $data;
        }, 20, 2);

        add_filter(PAYMENT_FILTER_PAYMENT_INFO_DETAIL, function ($data, $payment) {
            if ($payment->payment_channel == ONEPAY_PAYMENT_METHOD_NAME) {
                $paymentService = new OnePayPaymentService();
                $paymentDetail = $paymentService->getPaymentDetails($payment->charge_id);

                if ($paymentDetail) {
                    $data = view('plugins/onepay::detail', ['payment' => $paymentDetail, 'paymentModel' => $payment])->render();
                }
            }

            return $data;
        }, 20, 2);

        add_filter(PAYMENT_FILTER_GET_REFUND_DETAIL, function ($data, $payment, $refundId) {
            if ($payment->payment_channel == ONEPAY_PAYMENT_METHOD_NAME) {
                $refundDetail = (new OnePayPaymentService())->getRefundDetails($refundId);
                if (!Arr::get($refundDetail, 'error')) {
                    $refunds = Arr::get($payment->metadata, 'refunds', []);
                    $refund = collect($refunds)->firstWhere('id', $refundId);
                    $refund = array_merge((array) $refund, Arr::get($refundDetail, 'data', []));

                    return array_merge($refundDetail, [
                        'view' => view('plugins/onepay::refund-detail', ['refund' => $refund, 'paymentModel' => $payment])->render(),
                    ]);
                }

                return $refundDetail;
            }

            return $data;
        }, 20, 3);
    }

    public function addPaymentSettings(?string $settings): string
    {
        return $settings . view('plugins/onepay::settings')->render();
    }

    public function registerOnePayMethod(?string $html, array $data): string
    {
        $apiKey = get_payment_setting('merchant', ONEPAY_PAYMENT_METHOD_NAME);
        $apiSecret = get_payment_setting('accessCode', ONEPAY_PAYMENT_METHOD_NAME);

        if (!$apiKey || !$apiSecret) {
            return $html;
        }

        $data['errorMessage'] = null;
        $data['orderId'] = null;

        try {
            $api = new Api($apiKey, $apiSecret);

            $receiptId = Str::random(20);

            $amount = $data['amount'] * 100;

            $order = $api->order->create([
                'receipt' => $receiptId,
                'amount' => (int)round($amount),
                'currency' => $data['currency'],
            ]);

            $data['orderId'] = $order['id'];
        } catch (Exception $exception) {
            $data['errorMessage'] = $exception->getMessage();
        }

        return $html . view('plugins/onepay::methods', $data)->render();
    }

    public function checkoutWithOnePay(array $data, Request $request): array
    {

        if (str_contains($request->input('payment_method'), ONEPAY_PAYMENT_METHOD_NAME)) {
            try {
                $currentCurrency = get_application_currency();
                $currencyModel = $currentCurrency->replicate();
                $OnePayService = $this->app->make(OnePayPaymentService::class);

                $supportedCurrencies = $OnePayService->supportedCurrencyCodes();
                $currency = strtoupper($currentCurrency->title);
                $notSupportCurrency = false;
                if (!in_array($currency, $supportedCurrencies)) {
                    $notSupportCurrency = true;

                    if (!$currencyModel->where('title', 'USD')->exists()) {
                        $data['error'] = true;
                        $data['message'] = __(":name doesn't support :currency. List of currencies supported by :name: :currencies.", [
                            'name' => 'OnePay',
                            'currency' => $currency,
                            'currencies' => implode(', ', $supportedCurrencies),
                        ]);

                        return $data;
                    }
                }
                $paymentData = apply_filters(PAYMENT_FILTER_PAYMENT_DATA, [], $request);
                info('paymentData', [$paymentData]);
                if ($notSupportCurrency) {
                    $usdCurrency = $currencyModel->where('title', 'USD')->first();
                    $paymentData['currency'] = 'USD';
                    if ($currentCurrency->is_default) {
                        $paymentData['amount'] = $paymentData['amount'] * $usdCurrency->exchange_rate;
                    } else {
                        $paymentData['amount'] = format_price($paymentData['amount'], $currentCurrency, true);
                    }
                }

                if (!$request->input('callback_url')) {
                    info('callback_url', [route('payments.onepay.status')]);
                    $paymentData['callback_url'] = route('payments.onepay.status');
                }
                if (str_contains($request->input('payment_method'), "INTERNATIONAL")) {
                    $paymentData['vpc_CardList'] = 'INTERNATIONAL';
                } else if (str_contains($request->input('payment_method'), "DOMESTIC")) {
                    $paymentData['vpc_CardList'] = 'DOMESTIC';
                } else if (str_contains($request->input('payment_method'), "QR")) {
                    $paymentData['vpc_CardList'] = 'QR';
                } else if (str_contains($request->input('payment_method'), "TG")) {
                    $paymentData['vpc_CardList'] = '';
                }
                $checkoutUrl = $OnePayService->execute($paymentData);
                info('$checkoutUrl', [$checkoutUrl]);
                if ($checkoutUrl) {
                    $data['checkoutUrl'] = $checkoutUrl;
                } else {
                    $data['error'] = true;
                    $data['message'] = $OnePayService->getErrorMessage();
                }
            } catch (SignatureVerificationError $exception) {
                $data['message'] = $exception->getMessage();
                $data['error'] = true;
            }
        }

        return $data;
    }
}
