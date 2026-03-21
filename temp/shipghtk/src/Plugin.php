<?php

namespace Botble\ShipGhtk;

use Botble\PluginManagement\Abstracts\PluginOperationAbstract;
use Botble\Setting\Models\Setting;

class Plugin extends PluginOperationAbstract
{
    public static function remove()
    {
        Setting::query()
            ->whereIn('key', [
                'shipping_shipghtk_status',
                'shipping_shipghtk_host_key',
                'shipping_shipghtk_token_key',
                'shipping_shipghtk_sandbox',
            ])
            ->delete();
    }
}
