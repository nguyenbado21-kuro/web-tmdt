<?php

namespace Botble\ShipGhtk\Http\Controllers;

use Botble\Base\Http\Controllers\BaseController;
use Botble\Base\Http\Responses\BaseHttpResponse;
use Botble\Ecommerce\Enums\ShippingStatusEnum;
use Botble\Ecommerce\Models\Order;
use Botble\Ecommerce\Models\Shipment;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentHistoryInterface;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentInterface;
use Botble\Payment\Enums\PaymentMethodEnum;
use Botble\ShipGhtk\ShipGhtk;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Throwable;

class ShipGhtkController extends BaseController
{
    protected ShipmentInterface $shipmentRepository;

    protected ShipmentHistoryInterface $shipmentHistoryRepository;

    protected ShipGhtk $shipghtk;

    protected string|int|null $userId = 0;

    public function __construct(
        ShipmentInterface $shipmentRepository,
        ShipmentHistoryInterface $shipmentHistoryRepository,
        ShipGhtk $shipghtk
    ) {
        $this->shipmentRepository = $shipmentRepository;
        $this->shipmentHistoryRepository = $shipmentHistoryRepository;
        $this->shipghtk = $shipghtk;
        if (is_in_admin(true) && Auth::check()) {
            $this->userId = Auth::id();
        }
    }

    public function show(int $id, BaseHttpResponse $response)
    {
        $shipment = $this->shipmentRepository->findOrFail($id);
        $this->check($shipment);

        $order = $shipment->order;

        $content = '';
        $errors = [];
        
        try {
          
            $shipmentShipghtk = $this->shipghtk->getShipmentOrder($shipment->shipment_id);
           
                $rate = [];
                $payment = $order->payment;
               
                if (! $rate) {
                    $rates = Arr::get($shipmentShipghtk, 'rates', []);
                    $rate = Arr::first($rates, function ($value) use ($shipment) {
                        return Arr::get($value, 'id') == $shipment->rate_id;
                    });
                }

                $content = view('plugins/shipghtk::info', compact('rate', 'shipmentShipghtk', 'shipment', 'order'))->render();
           
        } catch (Throwable $th) {
            $errors[] = $th->getMessage();
        }

        return $response->setError((bool) $errors)
            ->setData([
                'html' => $content,
                'errors' => $errors,
            ])
            ->setMessage($errors ? Arr::first($errors) : '');
    }

    public function createTransaction(int $id, BaseHttpResponse $response)
    {
        $shipment = $this->shipmentRepository->findOrFail($id);

        $this->check($shipment);

        if (! $this->shipghtk->canCreateTransaction($shipment)) {
            abort(404);
        }

        $message = trans('plugins/shipghtk::shipghtk.transaction.created_success');

        $errors = [];
        $responseData = [];

        try {
            $transaction = $this->shipghtk->createTransaction($shipment->rate_id);
            if (Arr::get($transaction, 'status') == 'SUCCESS') {
                $shipment->tracking_link = Arr::get($transaction, 'tracking_url_provider');
                $shipment->label_url = Arr::get($transaction, 'label_url');
                $shipment->tracking_id = Arr::get($transaction, 'object_id');
                $shipment->metadata = json_encode($transaction);
                $shipment->status = ShippingStatusEnum::READY_TO_BE_SHIPPED_OUT;
                $shipment->save();

                $this->shipmentHistoryRepository->createOrUpdate([
                    'action' => 'create_transaction',
                    'description' => trans('plugins/shipghtk::shipghtk.transaction.created', [
                        'tracking' => Arr::get($transaction, 'tracking_number'),
                    ]),
                    'order_id' => $shipment->order_id,
                    'user_id' => $this->userId,
                    'shipment_id' => $shipment->id,
                ]);

                $this->shipmentHistoryRepository->createOrUpdate([
                    'action' => 'update_status',
                    'description' => trans('plugins/ecommerce::shipping.changed_shipping_status', [
                        'status' => ShippingStatusEnum::getLabel(ShippingStatusEnum::READY_TO_BE_SHIPPED_OUT),
                    ]),
                    'order_id' => $shipment->order_id,
                    'user_id' => $this->userId,
                    'shipment_id' => $shipment->id,
                ]);
            } else {
                if ($errors = Arr::get($transaction, 'messages', [])) {
                    $message = collect($errors)->pluck('text')->implode('; ');
                }
            }
        } catch (Exception $ex) {
            $errors[] = $ex->getMessage();
            $message = $ex->getMessage();
        }

        $responseData['errors'] = (array) $errors;

        return $response->setError((bool) count($errors))
            ->setMessage($message)
            ->setData($responseData);
    }

    protected function refreshShipment(array $shipmentShipGhtk, Order $order)
    {
        if (! Arr::has($shipmentShipGhtk, 'extra.reference_2')) {
            Arr::set($shipmentShipGhtk, 'extra.reference_2', $order->code);
        }

        $params = [
            'address_from' => Arr::get($shipmentShipGhtk, 'address_from.object_id'),
            'address_to' => Arr::get($shipmentShipGhtk, 'address_to.object_id'),
            'extra' => Arr::get($shipmentShipGhtk, 'extra'),
            'parcels' => [Arr::get($shipmentShipGhtk, 'parcels.0.object_id')],
        ];

        if (Arr::has($shipmentShipGhtk, 'customs_declaration')) {
            $params['customs_declaration'] = Arr::get($shipmentShipGhtk, 'customs_declaration');
        }

        if (Arr::has($shipmentShipGhtk, 'metadata')) {
            $params['metadata'] = Arr::get($shipmentShipGhtk, 'metadata');
        }

        return $this->shipghtk->createShipment($params);
    }

    public function getRates(int $id, BaseHttpResponse $response)
    {
        $shipment = $this->shipmentRepository->findOrFail($id);

        $this->check($shipment);

        $content = '';
        $errors = [];
        $order = $shipment->order;

        try {
            $shipmentShipGhtk = $this->shipghtk->retrieveShipment($shipment->shipment_id);

            $shipmentShipGhtk = $this->refreshShipment($shipmentShipGhtk, $order);
            $rates = Arr::get($shipmentShipGhtk, 'rates', []);

            $rates = $this->shipghtk->sortRates($rates);

            $rate = Arr::first($rates, function ($value) use ($order) {
                return Arr::get($value, 'servicelevel.token') == $order->shipping_option;
            });

            if ($rate) {
                $rates = Arr::where($rates, function ($value) use ($rate) {
                    return Arr::get($value, 'servicelevel.token') !== Arr::get($rate, 'servicelevel.token');
                });
            }

            $content = view('plugins/shipghtk::rates', compact('rates', 'shipmentShipGhtk', 'shipment', 'order', 'rate'))->render();
        } catch (Throwable $th) {
            $errors[] = $th->getMessage();
        }

        return $response->setError((bool) $errors)
            ->setData([
                'html' => $content,
                'errors' => $errors,
            ])
            ->setMessage($errors ? Arr::first($errors) : '');
    }

    public function updateRate(int $id, Request $request, BaseHttpResponse $response)
    {
        $shipment = $this->shipmentRepository->findOrFail($id);

        $this->check($shipment);

        $order = $shipment->order;

        $content = '';
        $errors = [];

        try {
            $shipmentShipGhtk = $this->shipghtk->retrieveShipment($shipment->shipment_id);

            $shipmentShipGhtk = $this->refreshShipment($shipmentShipGhtk, $order);

            $rates = Arr::get($shipmentShipGhtk, 'rates', []);
            $rates = $this->shipghtk->sortRates($rates);

            $rate = Arr::first($rates, function ($value) use ($order) {
                return Arr::get($value, 'servicelevel.token') == $order->shipping_option;
            });

            if (! $rate) {
                $rate = Arr::first($rates, function ($value) use ($request) {
                    return Arr::get($value, 'servicelevel.token') == $request->input('shipping_option');
                });
            }

            if ($rate) {
                $order->shipping_option = Arr::get($rate, 'servicelevel.token');
                $order->save();
                $shipment->shipment_id = Arr::get($shipmentShipGhtk, 'object_id');
                $shipment->rate_id = Arr::get($rate, 'object_id');
                $shipment->save();

                $content = view('plugins/shipghtk::info', compact('rate', 'shipmentShipGhtk', 'shipment', 'order'))->render();
            } else {
                $errors[] = 'Rate not found';
            }
        } catch (Throwable $th) {
            $errors[] = $th->getMessage();
        }

        return $response->setError((bool) $errors)
            ->setData([
                'html' => $content,
                'errors' => $errors,
            ])
            ->setMessage($errors ? Arr::first($errors) : trans('plugins/shipghtk::shipghtk.updated_rate_success'));
    }

    protected function check(Shipment $shipment): bool
    {
        $order = $shipment->order;

        if (! is_in_admin(true)) {
            if (is_plugin_active('marketplace')) {
                $vendor = auth('customer')->user();
                $store = $vendor->store;

                if ($store->id != $order->store_id) {
                    abort(403);
                }
            }
        }

        if (! $order || ! $order->id
            || $order->shipping_method->getValue() != SHIPGHTK_SHIPPING_METHOD_NAME
            || ! $shipment->shipment_id) {
            abort(404);
        }

        return true;
    }
}
