<?php

namespace Botble\ShipViettelPost;

use Botble\PluginManagement\Abstracts\PluginOperationAbstract;
use Botble\Setting\Models\Setting;

class Plugin extends PluginOperationAbstract
{
    public static function remove()
    {
        Setting::query()
            ->whereIn('key', [
                'shipping_shipviettelpost_status',
                'shipping_shipviettelpost_host_key',
                'shipping_shipviettelpost_user_name',
                'shipping_shipviettelpost_password',
                'shipping_shipviettelpost_sandbox',
            ])
            ->delete();
    }
}
