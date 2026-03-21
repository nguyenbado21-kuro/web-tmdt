<?php

namespace Botble\OnePay\Services\Abstracts;

use Botble\Payment\Services\Traits\PaymentErrorTrait;
use Botble\Support\Services\ProduceServiceInterface;
use Exception;
//use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use PhpParser\Node\Stmt\Return_;
use Razorpay\Api\Api;
use Botble\Payment\Supports\PaymentHelper;
use Symfony\Component\Uid\UuidV4;
use Request;

abstract class OnePayPaymentAbstract
{
    use PaymentErrorTrait;
    /**
     * @var string
     */
    protected $transactionDescription;
    /**
     * @var array
     */
    protected $itemList;

    /**
     * @var string
     */
    protected $paymentCurrency;

    /**
     * @var object
     */
    protected $client;

    /**
     * @var bool
     */
    protected $supportRefundOnline;

    /**
     * @var string
     */
    protected $cancelUrl;

    /**
     * @var integer
     */
    protected $returnUrl;

    /**
     * @var 
     */
    protected $totalAmount;

    /**
     * @var string
     */
    protected $customer;

    /**
     * VnPayPaymentAbstract constructor.
     */
    public function __construct()
    {
        $this->paymentCurrency = config('plugins.payment.payment.currency');

        $this->totalAmount = 0;

        $this->setClient();

        $this->supportRefundOnline = true;
    }

    /**
     * @return bool
     */
    public function getSupportRefundOnline()
    {
        return $this->supportRefundOnline;
    }

    /**
     * @return object|Api
     */
    public function getClient()
    {
        return $this->client;
    }

    /**
     * Set client
     * @return self
     */
    public function setClient()
    {
        $key = get_payment_setting('merchant', ONEPAY_PAYMENT_METHOD_NAME);
        $secret = get_payment_setting('accessCode', ONEPAY_PAYMENT_METHOD_NAME);
        $this->client = new Api($key, $secret);

        return $this;
    }

    /**
     * Set payment currency
     *
     * @param string $currency String name of currency
     * @return self
     */
    public function setCurrency($currency)
    {
        $this->paymentCurrency = $currency;

        return $this;
    }

    /**
     * Get current payment currency
     *
     * @return string Current payment currency
     */
    public function getCurrency()
    {
        return $this->paymentCurrency;
    }

    /**
     * Get payment details
     *
     * @param string $paymentId
     * @return mixed Object payment details
     * @throws Exception
     */
    public function getPaymentDetails($paymentId)
    {
        try {
            $response = $this->client->payment->fetch($paymentId); // Returns a particular payment
        } catch (Exception $exception) {
            $this->setErrorMessageAndLogging($exception, 1);

            return false;
        }

        return $response;
    }

    /**
     * This function can be used to preform refund on the capture.
     */
    public function refundOrder($paymentId, $amount, array $options = [])
    {
        try {
            $response = $this->client->refund->create([
                'payment_id' => $paymentId,
                'amount' => $amount * 100,
                'notes' => $options,
            ]);

            $status = $response->status;

            if ($response->status == 'processed') {
                $response = $response->toArray();
                $response = array_merge($response, ['_refund_id' => Arr::get($response, 'id')]);

                return [
                    'error' => false,
                    'message' => $status,
                    'data' => $response,
                ];
            }

            return [
                'error' => true,
                'message' => trans('plugins/payment::payment.status_is_not_completed'),
            ];
        } catch (Exception $exception) {
            $this->setErrorMessageAndLogging($exception, 1);

            return [
                'error' => true,
                'message' => $exception->getMessage(),
            ];
        }
    }

    /**
     * Get refund details
     *
     * @param string $refundId
     * @return mixed Object refund details
     * @throws Exception
     */
    public function getRefundDetails($refundId)
    {
        try {
            $response = $this->client->refund->fetch($refundId);

            return [
                'error' => false,
                'message' => $response->status,
                'data' => (array)$response->toArray(),
                'status' => $response->status,
            ];
        } catch (Exception $exception) {
            $this->setErrorMessageAndLogging($exception, 1);

            return [
                'error' => true,
                'message' => $exception->getMessage(),
            ];
        }
    }

    /**
     * Execute main service
     *
     * @param array $data
     *
     * @return mixed
     */
    public function execute(array $data)
    {
        try {
            return $this->makePayment($data);
        } catch (Exception $exception) {
            $this->setErrorMessageAndLogging($exception, 1);

            return false;
        }
    }

    /**
     * Make a payment
     *
     * @param array $data
     *
     * @return mixed
     */
    abstract public function makePayment(array $data);

    /**
     * List currencies supported https://razorpay.com/docs/payments/payments/international-payments/#supported-currencies
     * @return string[]
     */
    public function supportedCurrencyCodes(): array
    {
        return [
            'USD',
            'VND',
        ];
    }

    /**
     * Use this function to perform more logic after user has made a payment
     *
     * @param array $data
     *
     * @return mixed
     */
    abstract public function afterMakePayment(array $data);
    /**
     * @return bool
     */
    public function isSupportedDecimals()
    {
        return !in_array($this->getCurrency(), [
            'BIF',
            'CLP',
            'DJF',
            'GNF',
            'JPY',
            'KMF',
            'KRW',
            'MGA',
            'PYG',
            'RWF',
            'VND',
            'VUV',
            'XAF',
            'XOF',
            'XPF',
            ''
        ]);
    }
    /**
     * Set cancel URL
     *
     * @param string $url Cancel URL for payment
     * @return self
     */
    public function setCancelUrl($url)
    {
        $this->cancelUrl = $url;

        return $this;
    }
    /**
     * Set return URL
     *
     * @param string $url Return URL for payment process complete
     * @return self
     */
    public function setReturnUrl($url)
    {
        $this->returnUrl = $url;

        return $this;
    }
    /**
     * @param string $customer
     * @return self
     */
    public function setCustomer($customer)
    {
        $this->customer = $customer;

        return $this;
    }

    /**
     * Add item to list
     *
     * @param array $itemData Array item data
     * @return self
     */
    public function setItem($itemData)
    {
        if (count($itemData) === count($itemData, COUNT_RECURSIVE)) {
            $itemData = [$itemData];
        }

        foreach ($itemData as $data) {
            $amount = $data['price'] * $data['quantity'];

            $item = [
                'name' => $data['name'],
                'sku' => $data['sku'],
                'unit_amount' => [
                    'currency_code' => $this->paymentCurrency,
                    'value' => $amount,
                ],
                'quantity' => $data['quantity'],
            ];

            if ($description = Arr::get($data, 'description')) {
                $item['description'] = $description;
            }

            if ($tax = Arr::get($data, 'tax')) {
                $item['tax'] = [
                    'currency_code' => $this->paymentCurrency,
                    'value' => $tax,
                ];
            }

            if ($category = Arr::get($data, 'category')) {
                $item['category'] = $category;
            }

            $this->itemList[] = $item;
            $this->totalAmount += $amount;
        }

        // issue https://developer.paypal.com/docs/api/orders/v2/#error-DECIMAL_PRECISION
        $this->totalAmount = round((float)$this->totalAmount, $this->isSupportedDecimals() ? 2 : 0);

        return $this;
    }
    /**
     * Create payment
     *
     * @param array $data
     * @return mixed PayPal checkout URL or false
     * @throws Exception
     */
    public function createPayment(array $data)
    {
        info('$createPayment');
        info('$data', [$data]);
        $vpc_TxnRef = uniqid(); //Mã giao dịch thanh toán tham chiếu của merchant
        if (!empty($data['vpc_CardList'])) {
            $merchant = get_payment_setting('merchant', ONEPAY_PAYMENT_METHOD_NAME);
            $accessCode = get_payment_setting('accessCode', ONEPAY_PAYMENT_METHOD_NAME);
            $secureSecret = get_payment_setting('secureSecret', ONEPAY_PAYMENT_METHOD_NAME);
        } else {
            $merchant = get_payment_setting('merchant_tg', ONEPAY_PAYMENT_METHOD_NAME);
            $accessCode = get_payment_setting('accessCode_tg', ONEPAY_PAYMENT_METHOD_NAME);
            $secureSecret = get_payment_setting('secureSecret_tg', ONEPAY_PAYMENT_METHOD_NAME);
        }


        $ipUser = Request::ip();
        $inputData = array(
            "vpc_Version" => 2,
            "vpc_Merchant" => $merchant,
            "vpc_AccessCode" => $accessCode,
            "vpc_Amount" => round((float)$data['amount'], $this->isSupportedDecimals() ? 2 : 0) * 100,
            "vpc_Command" => "pay",
            "vpc_Currency" => "VND",
            "vpc_TicketNo" => $ipUser,
            "vpc_Locale" => "vn",
            "vpc_OrderInfo" => "Thanh toan GD: {$vpc_TxnRef}",
            "vpc_MerchTxnRef" => $vpc_TxnRef,
            "vpc_ReturnURL" => $this->returnUrl,
            "AgainLink" => urlencode($_SERVER['HTTP_REFERER']),
            "Title" => "VPC 3-Party",
            "vpc_CardList" => $data['vpc_CardList'],
        );
        $checkoutUrl = get_payment_setting('host', ONEPAY_PAYMENT_METHOD_NAME) . "?";
        $md5HashData = "";
        ksort($inputData);
        // set a parameter to show the first pair in the URL
        $appendAmp = 0;
        foreach ($inputData as $key => $value) {
            // create the md5 input and URL leaving out any fields that have no value
            if (strlen($value) > 0) {
                // this ensures the first paramter of the URL is preceded by the '?' char
                if ($appendAmp == 0) {
                    $checkoutUrl .= urlencode($key) . '=' . urlencode($value);
                    $appendAmp = 1;
                } else {
                    $checkoutUrl .= '&' . urlencode($key) . "=" . urlencode($value);
                }
                //$md5HashData .= $value; sử dụng cả tên và giá trị tham số để mã hóa
                if ((strlen($value) > 0) && ((substr($key, 0, 4) == "vpc_") || (substr($key, 0, 5) == "user_"))) {
                    $md5HashData .= $key . "=" . $value . "&";
                }
            }
        }
        //xóa ký tự & ở thừa ở cuối chuỗi dữ liệu mã hóa
        $md5HashData = rtrim($md5HashData, "&");
        // Create the secure hash and append it to the Virtual Payment Client Data if
        // the merchant secret has been provided.
        if (strlen($secureSecret) > 0) {
            // Thay hàm mã hóa dữ liệu
            $checkoutUrl .= "&vpc_SecureHash=" . strtoupper(hash_hmac('SHA256', $md5HashData, pack('H*', $secureSecret)));
            //$checkoutUrl .= "&vpc_SecureHash=EB1B7F75EBB2FAABD6763FC37A3628AF";
        }
        session(['onepay_payment_id' => $vpc_TxnRef]);
        return $checkoutUrl;
    }
    public function getPaymentStatus(array $data)
    {
    }
}
