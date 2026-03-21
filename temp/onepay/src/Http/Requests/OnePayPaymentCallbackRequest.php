<?php

namespace Botble\OnePay\Http\Requests;

use Botble\Support\Http\Requests\Request;

class OnePayPaymentCallbackRequest extends Request
{
    public function rules(): array
    {
        return [
            //'vnp_Amount' => 'required|numeric',
            //'currency' => 'required',
        ];
    }
}
