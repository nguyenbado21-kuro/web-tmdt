<?php

namespace Botble\OnePay;

use Botble\PluginManagement\Abstracts\PluginOperationAbstract;
use Botble\Setting\Models\Setting;

class Plugin extends PluginOperationAbstract
{
    public static function remove()
    {
        Setting::query()
            ->whereIn('key', [
                'payment_onepay_name',
                'payment_onepay_description',
                'payment_onepay_key',
                'payment_onepay_secret',
                'payment_onepay_status',
                'payment_onepay_merchant',
                'payment_onepay_accessCode',
                'payment_onepay_merchant_tg',
                'payment_onepay_accessCode_tg',
                'payment_onepay_host',
                'payment_onepay_secureSecret',
                'payment_onepay_secureSecret_tg'
            ])
            ->delete();
    }
}
