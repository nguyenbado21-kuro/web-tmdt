<?php

namespace Botble\OnePay\Http\Controllers;

use Botble\Base\Http\Responses\BaseHttpResponse;
use Botble\OnePay\Http\Requests\OnePayPaymentCallbackRequest;
use Botble\OnePay\Services\Gateways\OnePayPaymentService;
use Botble\Payment\Supports\PaymentHelper;
use Illuminate\Routing\Controller;

class OnePayController extends Controller
{
    public function getCallback(
        OnePayPaymentCallbackRequest $request,
        OnePayPaymentService $onePayPaymentService,
        BaseHttpResponse $response
    ) {
        $vpc_Txn_Secure_Hash = $request->input('vpc_SecureHash');
        $inputData = array();
        foreach ($_GET as $key => $value) {
            if (substr($key, 0, 4) == "vpc_") {
                $inputData[$key] = $value;
            }
        }
        unset($inputData['vpc_SecureHash']);
        // sort all the incoming vpc response fields and leave out any with no value
        ksort($inputData);
        $SECURE_SECRET = get_payment_setting('secureSecret_tg', ONEPAY_PAYMENT_METHOD_NAME);
        if ($inputData['vpc_Merchant'] == "TESTONEPAY33") {
            $SECURE_SECRET = get_payment_setting('secureSecret', ONEPAY_PAYMENT_METHOD_NAME);
        }

        if (strlen($SECURE_SECRET) > 0 && $inputData["vpc_TxnResponseCode"] != "7" && $inputData["vpc_TxnResponseCode"] != "No Value Returned") {
            //khởi tạo chuỗi mã hóa rỗng
            $md5HashData = "";
            foreach ($inputData as $key => $value) {
                //      chỉ lấy các tham số bắt đầu bằng "vpc_" hoặc "user_" và khác trống và không phải chuỗi hash code trả về
                if ($key != "vpc_SecureHash" && (strlen($value) > 0) && ((substr($key, 0, 4) == "vpc_") || (substr($key, 0, 5) == "user_"))) {
                    $md5HashData .= $key . "=" . $value . "&";
                }
            }
            //  Xóa dấu & thừa cuối chuỗi dữ liệu
            $md5HashData = rtrim($md5HashData, "&");

            //    Thay hàm tạo chuỗi mã hóa
            if (strtoupper($vpc_Txn_Secure_Hash) == strtoupper(hash_hmac('SHA256', $md5HashData, pack('H*', $SECURE_SECRET)))) {
                // Secure Hash validation succeeded, add a data field to be displayed
                // later.
                if ($request->input('vpc_TxnResponseCode') == '0') {
                    info('$$request->input()', [$request->input()]);
                    $onePayPaymentService->afterMakePayment($request->input());
                    info('onePayPaymentService', ['done']);
                    info('getRedirectURL', [PaymentHelper::getRedirectURL()]);
                    return $response
                        ->setNextUrl(PaymentHelper::getRedirectURL())
                        ->setMessage(__('Checkout successfully!'));
                } else {
                    return $response
                        ->setError()
                        ->setNextUrl(PaymentHelper::getCancelURL())
                        ->withInput()
                        ->setMessage(__('Payment failed!!'));
                }
            } else {
                // Secure Hash validation failed, add a data field to be displayed
                // later.
                return $response
                    ->setError()
                    ->setNextUrl(PaymentHelper::getCancelURL())
                    ->withInput()
                    ->setMessage(__('Chu ki khong hop le'));
            }
        } else {
            // Secure Hash was not validated, add a data field to be displayed later.
            return $response
                ->setError()
                ->setNextUrl(PaymentHelper::getCancelURL())
                ->withInput()
                ->setMessage(__('Chu ki khong hop le'));
            //$hashValidated = "INVALID HASH";
        }
    }
}
