<?php

namespace Botble\ShipViettelPost\Http\Controllers;

use Botble\Base\Http\Controllers\BaseController;
use Botble\Base\Http\Responses\BaseHttpResponse;
use Botble\Ecommerce\Services\HandleShippingFeeService;
use Botble\Setting\Supports\SettingStore;
use Botble\ShipViettelPost\ShipViettelPost;
use Botble\Support\Services\Cache\Cache;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ShipViettelPostSettingController extends BaseController
{
    public function update(Request $request, BaseHttpResponse $response, SettingStore $settingStore)
    {
        $data = Arr::where($request->except(['_token']), function ($value, $key) {
            return Str::startsWith($key, 'shipping_');
        });

        foreach ($data as $settingKey => $settingValue) {
            $settingStore->set($settingKey, $settingValue);
        }

        $settingStore->save();

        $cache = new Cache(app('cache'), HandleShippingFeeService::class);
        $cache->flush();

        $message = trans('plugins/shipviettelpost::shipviettelpost.saved_shipping_settings_success');
        $isError = false;

        if ($request->input('shipping_shipviettelpost_validate')) {
            $errors = app(ShipGhtk::class)->validate();
            if ($errors) {
                $message = $errors[0];
                $isError = true;
            }
        }

        return $response->setError($isError)->setMessage($message);
    }
}
