<?php

namespace Botble\ShipGhtk\Providers;

use Assets;
use Botble\Ecommerce\Enums\ShippingMethodEnum;
use Botble\Ecommerce\Models\Shipment;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentHistoryInterface;
use Botble\ShipGhtk\Ghtk;
use Botble\ShipGhtk\ShipGhtk;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Throwable;
use Str;

class HookServiceProvider extends ServiceProvider
{
    public string $langPath = 'plugins/shipghtk::shipping.methods';
    public function boot(): void
    {
        add_filter('handle_shipping_update_status_SHIP_GHTK', [$this, 'handleShippingUpdateStatus'], 11, 3);
        add_filter('handle_shipping_fee', [$this, 'handleShippingFee'], 11, 3);

        add_filter(SHIPPING_METHODS_SETTINGS_PAGE, [$this, 'addSettings'], 2);

        add_filter(SHIPPING_METHOD_FILTER_ENUM_ARRAY, [$this, 'handleShippingEnumArray'], 2, 2);

        add_filter(SHIPPING_FILTER_ENUM_LABEL, function ($value) {
            $key = sprintf(
                '%s.%s',
                $this->langPath,
                $value
            );
            if (Lang::has($key)) {
                return trans($key);
            }
            return $value;
        }, 2);

        add_filter('shipmentghtk_buttons_detail_order', function (?string $content, Shipment $shipment) {
            Assets::addScriptsDirectly('vendor/core/plugins/shipghtk/js/shipghtk.js');
            $content .= view('plugins/shipghtk::buttons', compact('shipment'))->render();
            return $content;
        }, 1, 2);
        add_filter('handle_shipping_create_order', [$this, 'handleShippingCreateOrder'], 11, 3);
        add_filter('handle_shipping_fee_async', [$this, 'handleShippingFeeAsync'], 11, 3);
        add_filter('handle_shipping_print_order', [$this, 'handleShippingPrintOrder'], 11, 2);
    }
    public function handleShippingPrintOrder($prev, $order)
    {
        $shipGhtk = app(Ghtk::class);
        if ($order->shipping_method == $shipGhtk->getName()) {
            return $shipGhtk->printOrder($order->shipment->shipment_id);
        }
        return $prev;
    }

    public function handleShippingCreateOrder($prev, $order, $addressOrigin)
    {
        $shipGhtk = app(Ghtk::class);
        if ($order->shipping_method == $shipGhtk->getName()) {
            return $shipGhtk->createShipmentByOrder($order, $addressOrigin);
        }
        return $prev;
    }

    public function handleShippingEnumArray($result)
    {
        $result['GHTK_SHIPPING_METHOD_NAME'] = SHIPGHTK_SHIPPING_METHOD_NAME;
        return $result;
    }

    public function handleShippingUpdateStatus(Shipment $shipment)
    {
        $shipGhtk = app(ShipGhtk::class);
        $data = $shipGhtk->getShipmentInfo($shipment->shipment_id);; // get Data From Api ShipGhtk
        $is_updated = $data['success'] && Carbon::parse($shipment['updated_at'])->addMinutes(5) >= Carbon::parse($data['modified'] ?? '');
        if ($is_updated) {
            return $shipment;
        }
        $status = Arr::get($data ?? [], 'order.status');
        if ($status && $statusShipment = $shipGhtk->ConvertStatus($status)) {
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
        $shipe = app(Ghtk::class);
        return [...$shipe->callPriceAll($data), ...$result];
    }
    /**
     * @param array $result
     * @param array $data
     * @return array
     *
     * @throws Throwable
     */
    public function handleShippingFee($result, $data): array
    {


        Log::info('handleShippingFee:ShipGhtk:before', $data);
        try {
            if (!isset($result['shipment'])) {
                $result['shipment'] = [];
            }
            if (!$this->app->runningInConsole() && setting('shipping_shipghtk_status') == 1) {
                $shipe = app(ShipGhtk::class);
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
                            if (!isset($result['shipment'][$key])) {
                                $result['shipment'][$key] = $value;
                            }
                        }
                        Log::info('handleShippingFee:ShipGhtk:process');
                    }
                }
            }
        } catch (\Exception $e) {
            Log::info('handleShippingFee:ShipGhtk:error', [__LINE__, $e->getMessage()]);
        }

        Log::info('handleShippingFee:ShipGhtk:result', $result);
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
        return $settings . view('plugins/shipghtk::settings')->render();
    }
}
