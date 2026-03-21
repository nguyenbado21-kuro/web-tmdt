<?php

namespace Botble\OnePay\Services\Gateways;

use Botble\Payment\Enums\PaymentStatusEnum;
use Botble\Payment\Supports\PaymentHelper;
use Botble\OnePay\Services\Abstracts\OnePayPaymentAbstract;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Nette\Utils\Floats;

class OnePayPaymentService extends OnePayPaymentAbstract
{
    /**
     * Make a payment
     *
     * @param array $data
     *
     * @return mixed
     * @throws Exception
     */
    public function makePayment(array $data)
    {
        info('makePayment');
        $amount = round((float)$data['amount'], $this->isSupportedDecimals() ? 2 : 0);

        $currency = $data['currency'];
        $currency = strtoupper($currency);

        $queryParams = [
            'type' => ONEPAY_PAYMENT_METHOD_NAME,
            'amount' => $amount,
            'currency' => $currency,
            'order_id' => $data['order_id'],
            'customer_id' => Arr::get($data, 'customer_id'),
            'customer_type' => Arr::get($data, 'customer_type'),
        ];
        info('callback_url_queryParams',[$data['callback_url'] . '?' . http_build_query($queryParams)]);
        if ($cancelUrl = $data['return_url'] ?: PaymentHelper::getCancelURL()) {
            info('$cancelUrl',[$cancelUrl]);
            $this->setCancelUrl($cancelUrl);
        }

        return $this
            ->setReturnUrl($data['callback_url'] . '?' . http_build_query($queryParams))
            ->setCurrency($currency)
            ->setCustomer(Arr::get($data, 'address.email'))
            ->setItem([
                'name' => $data['description'],
                'quantity' => 1,
                'price' => $amount,
                'sku' => null,
                'type' => ONEPAY_PAYMENT_METHOD_NAME,
            ])
            ->createPayment($data);
    }

    /**
     * Use this function to perform more logic after user has made a payment
     *
     * @param array $data
     *
     * @return mixed
     */
    public function afterMakePayment(array $data)
    {
        info('afterMakePayment', $data);
        $status = PaymentStatusEnum::COMPLETED;
        $chargeId = session('onepay_payment_id');
        info('$chargeId',[$chargeId]);
        $orderIds = (array)Arr::get($data, 'order_id', []);
        info('$chargeId', [$chargeId]);
        do_action(PAYMENT_ACTION_PAYMENT_PROCESSED, [
            'amount' => (float)$data['vpc_Amount']/100,
            'currency' => 'VND',
            'charge_id' => $chargeId,
            'order_id' => $orderIds,
            'customer_id' => Arr::get($data, 'customer_id'),
            'customer_type' => Arr::get($data, 'customer_type'),
            'payment_channel' => ONEPAY_PAYMENT_METHOD_NAME,
            'status' => $status,
        ]);

        session()->forget('onepay_payment_id');

        return $chargeId;
    }
}
