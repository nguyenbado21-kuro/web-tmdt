<?php

namespace Botble\ShipViettelPost\Providers;

use Assets;
use Botble\Ecommerce\Models\Shipment;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentHistoryInterface;
use Botble\ShipViettelPost\ShipViettelPost;
use Botble\ShipViettelPost\ViettelPost;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Throwable;

class HookServiceProvider extends ServiceProvider
{
    private string $langPath = 'plugins/shipviettelpost::shipping.methods';

    public function boot(): void
    {
        add_filter('handle_shipping_update_status_SHIP_VIETTEL_POST', [$this, 'handleShippingUpdateStatus'], 11, 3);
        add_filter('handle_shipping_fee', [$this, 'handleShippingFee'], 11, 3);
        add_filter(SHIPPING_METHODS_SETTINGS_PAGE, [$this, 'addSettings'], 2);

        add_filter(SHIPPING_METHOD_FILTER_ENUM_ARRAY, [$this, 'handleShippingEnumArray'], 1, 2);

        add_filter(SHIPPING_FILTER_ENUM_LABEL, [$this, 'handleShippingEnumLabel'], 1, 2);
        add_filter('handle_shipping_create_order', [$this, 'handleShippingCreateOrder'], 11, 3);
        add_filter('handle_shipping_fee_async', [$this, 'handleShippingFeeAsync'], 11, 3);
        add_filter('handle_shipping_print_order', [$this, 'handleShippingPrintOrder'], 11, 2);
    }
    public function handleShippingPrintOrder($prev, $order)
    {
        $shipviettelpost = app(ViettelPost::class);
        if ($order->shipping_method == $shipviettelpost->getName()) {
            return $shipviettelpost->printOrder((int)$order->shipment->shipment_id);
        }
        return $prev;
    }
    public function handleShippingCreateOrder($prev, $order, $addressOrigin)
    {
        $shipviettelpost = app(ViettelPost::class);
        if ($order->shipping_method == $shipviettelpost->getName()) {
            return $shipviettelpost->createShipmentByOrder($order, $addressOrigin);
        }
        return $prev;
    }

    public function handleShippingEnumArray($result)
    {
        $result['VIETTEL_POST_SHIPPING_METHOD_NAME'] = SHIP_VIETTEL_POST;
        return $result;
    }
    public function handleShippingEnumLabel($value)
    {
        $key = sprintf(
            '%s.%s',
            $this->langPath,
            $value
        );
        if (Lang::has($key)) return trans($key);
        return $value;
    }
    public function handleShippingUpdateStatus(Shipment $shipment)
    {
        $shipviettelpost = app(ShipViettelPost::class);
        $data = $shipviettelpost->getShipmentInfo($shipment->shipment_id); // get Data From Api ShipViettelPost
        $is_updated = isset($data['data']) && Carbon::parse($shipment['updated_at'])->addMinutes(5) >= Carbon::parse(Arr::get($data ?? [], 'data.ORDER_STATUSDATE'));

        if ($is_updated) {
            return $shipment;
        }
        $status = Arr::get($data ?? [], 'data.ORDER_STATUS');
        if ($status && $statusShipment = $shipviettelpost->ConvertStatus($status)) {
            $shipment->status = $statusShipment;
            $shipment->save();

            app(ShipmentHistoryInterface::class)->createOrUpdate([
                'action' => 'track_updated',
                'description' => trans('plugins/shipviettelpost::shipviettelpost.tracking.statuses.' . Str::lower($status)),
                'order_id' => $shipment->order_id,
                'user_id' => 0,
                'shipment_id' => $shipment->id,
            ]);
        }
        return $shipment;
    }
    public function handleShippingFeeAsync($result, $data)
    {
        // return $result;
        $shipe = app(ViettelPost::class);
        return [...$shipe->callPriceAll($data), ...$result];
    }
    public function handleShippingFee($result, $data)
    {
        Log::info('handleShippingFee:ShipViettelPost:before', $data);

        if (!isset($result['shipment'])) {
            $result['shipment'] = [];
        }
        if (
            !$this->app->runningInConsole()
            && setting('shipping_shipviettelpost_status') == 1
            && (!isset($data['hide_choose_shipping']) || $data['hide_choose_shipping'] !== true)
        ) {
            $shipe = app(ShipViettelPost::class);
            if ($shipe->checkLiving()) {
                $results = $shipe->getRates($data);
                if ($rates = Arr::get($results, 'shipment.rates')) {
                    foreach ($rates as $key => $value) {
                        $price = Arr::get($result, 'shipment.' . $key . '.price');
                        if (
                            $price
                            && $value
                            && isset($result['shipment'][$key])
                            && isset($value['price'])
                            && $value['price'] > 0
                            && $price > $value['price']
                        ) {
                            $result['shipment'][$key] = $value;
                        }
                        if (!isset($result['shipment'][$key]) && $value['price'] > 0) {
                            $result['shipment'][$key] = $value;
                        }
                    }
                    Log::info('handleShippingFee:ShipViettelPost:process');
                }
            }
        }
        Log::info('handleShippingFee:ShipViettelPost:result', $result);
        return $result;
    }


    /**
     * @param string|null $settings
     * @return string
     *
     * @throws Throwable
     */
    public function addSettings(?string $settings): string
    {
        return $settings . view('plugins/shipviettelpost::settings')->render();
    }
}
