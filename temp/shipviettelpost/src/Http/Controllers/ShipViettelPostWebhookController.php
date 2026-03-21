<?php

namespace Botble\ShipViettelPost\Http\Controllers;

use Botble\Base\Http\Controllers\BaseController;
use Botble\Base\Http\Responses\BaseHttpResponse;
use Botble\Ecommerce\Enums\OrderStatusEnum;
use Botble\Ecommerce\Enums\ShippingStatusEnum;
use Botble\Ecommerce\Models\Shipment;
use Botble\Ecommerce\Repositories\Interfaces\OrderInterface;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentHistoryInterface;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentInterface;
use Botble\ShipViettelPost\ShipViettelPost;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ShipViettelPostWebhookController extends BaseController
{
    protected ShipmentInterface $shipmentRepository;

    protected ShipmentHistoryInterface $shipmentHistoryRepository;

    protected ShipViettelPost $shipviettelpost;

    public function __construct(
        ShipmentInterface $shipmentRepository,
        ShipmentHistoryInterface $shipmentHistoryRepository,
        ShipViettelPost $shipviettelpost,
        private OrderInterface $order,
    ) {
        $this->shipmentRepository = $shipmentRepository;
        $this->shipmentHistoryRepository = $shipmentHistoryRepository;
        $this->shipviettelpost = $shipviettelpost;
    }

    public function index(Request $request, BaseHttpResponse $response)
    {
        // $event = $request->input('event');
        $data = (array) $request->input();

        Log::info('ViettelPost Webhook---> request:'. json_encode($data));

        if (!isset($data['TOKEN']) || $data['TOKEN'] != setting('shipping_shipviettelpost_token','')) {
            return response()->json([
                'message' => 'Token invalid!',
            ]);
        }
        if (!isset($data['DATA'])) {
            return response()->json([
                'message' => 'Định dạng dữ liệu không hợp lệ.',
            ]);
        }

        $condition = [
            'shipment_id' => $data['DATA']['ORDER_NUMBER'],
        ];
        $shipment = $this->shipmentRepository->getFirstBy($condition);


        if (!$shipment) {
            $this->shipviettelpost->log([__LINE__, print_r($data['DATA'], true)]);

            return response()->json([
                'status'=> 404,
                'message'=> 'Không tìm thấy bản ghi.',
            ]);
        }
        $this->trackUpdated($shipment, $data);
        return response()->json([
            'status'=> 200,
            'message'=> 'Thành công',
        ]);
    }

    protected function transactionUpdated(Shipment $shipment, array $data)
    {
        $status = Arr::get($data, 'status');
        if ($status == 'REFUNDED') {
            $shipment->status = ShippingStatusEnum::CANCELED;
            $shipment->save();
        }

        $this->shipmentHistoryRepository->createOrUpdate([
            'action' => 'transaction_updated',
            'description' => trans('plugins/shipviettelpost::shipviettelpost.transaction.updated', [
                'tracking' => Arr::get($data, 'tracking_number'),
            ]),
            'order_id' => $shipment->order_id,
            'user_id' => 0,
            'shipment_id' => $shipment->id,
        ]);
    }

    protected function trackUpdated(Shipment $shipment, array $data)
    {
        $status = Arr::get($data['DATA'], 'ORDER_STATUS');
        if ($statusShipment= $this->shipviettelpost->ConvertStatus($status)) {
            $shipment->status = $statusShipment;
            $shipment->save();

             if ($statusShipment == ShippingStatusEnum::DELIVERED) {
                 if (!$order = $this->order->findById($shipment->order_id)) return;

                 $order->update([
                     'status'=>OrderStatusEnum::COMPLETED,
                 ]);
             }


            $this->shipmentHistoryRepository->createOrUpdate([
                'action' => 'track_updated',
                'description' => trans('plugins/shipviettelpost::shipviettelpost.tracking.statuses.' . Str::lower($status)),
                'order_id' => $shipment->order_id,
                'user_id' => 0,
                'shipment_id' => $shipment->id,
            ]);
        }
    }
}
