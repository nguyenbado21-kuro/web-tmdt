<?php

namespace Botble\ShipGhtk\Http\Controllers;

use Botble\Base\Http\Controllers\BaseController;
use Botble\Base\Http\Responses\BaseHttpResponse;
use Botble\Ecommerce\Enums\OrderStatusEnum;
use Botble\Ecommerce\Enums\ShippingStatusEnum;
use Botble\Ecommerce\Models\Shipment;
use Botble\Ecommerce\Repositories\Interfaces\OrderInterface;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentHistoryInterface;
use Botble\Ecommerce\Repositories\Interfaces\ShipmentInterface;
use Botble\ShipGhtk\ShipGhtk;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use OrderHelper;

class ShipGhtkWebhookController extends BaseController
{
    protected ShipmentInterface $shipmentRepository;

    protected ShipmentHistoryInterface $shipmentHistoryRepository;

    protected ShipGhtk $shipghtk;

    public function __construct(
        ShipmentInterface $shipmentRepository,
        ShipmentHistoryInterface $shipmentHistoryRepository,
        ShipGhtk $shipghtk,
        private OrderInterface $order,

    ) {
        $this->shipmentRepository = $shipmentRepository;
        $this->shipmentHistoryRepository = $shipmentHistoryRepository;
        $this->shipghtk = $shipghtk;
    }

    public function index(Request $request, BaseHttpResponse $response)
    {
        $data = (array) $request->input();

        Log::info('GHTK Webhook---> request:'. json_encode($data));

        if (!isset($data['hash']) || $data['hash'] != setting('shipping_shipghtk_hash','')) {
            return response()->json([
                'message' => 'Token invalid!',
            ]);
        }

        if (!isset($data['label_id']) || !isset($data['status_id']) ) {
            return response()->json([
                'message'=> 'Định dạng dữ liệu không hợp lệ.',
            ]);
        }
        $condition = [
            'shipment_id' => $data['label_id'],
        ];
        $shipment = $this->shipmentRepository->getFirstBy($condition);

        if (!$shipment) {
            $this->shipghtk->log([__LINE__, print_r($data['label_id'], true)]);

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
            'description' => trans('plugins/shipghtk::shipghtk.transaction.updated', [
                'tracking' => Arr::get($data, 'tracking_number'),
            ]),
            'order_id' => $shipment->order_id,
            'user_id' => 0,
            'shipment_id' => $shipment->id,
        ]);
    }

    protected function trackUpdated(Shipment $shipment, array $data)
    {
        $status = Arr::get($data, 'status_id');
        if ($statusShipment = $this->shipghtk->ConvertStatus($status)) {
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
                'description' => trans('plugins/shipghtk::shipghtk.tracking.statuses.' . Str::lower($status)),
                'order_id' => $shipment->order_id,
                'user_id' => 0,
                'shipment_id' => $shipment->id,
            ]);
        }
    }
}
