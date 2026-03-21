<?php

namespace Botble\ShipGhtk;

use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class Ghtk
{
    /**
     * @var string
     */
    protected $cHost;

    /**
     * @var string
     */
    protected $token;
    protected $client;
    public function getName()
    {
        return 'SHIP_GHTK';
    }
    public function __construct()
    {
        $this->cHost = setting('shipping_shipghtk_host_key');
        $this->token = setting('shipping_shipghtk_token_key');
        $this->client = new Client([
            'base_uri' => $this->cHost,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'http-version' => '1.1',
                'token' => $this->token
            ]
        ]);
    }
    /**
     * @param array $logs
     * @return self
     */
    public function log($logs): self
    {
        Log::info(__CLASS__, $logs);
        return $this;
    }
    private function callRequest($method, $url, $options = [], $withJson = true)
    {
        try {
            $rs = $this->client->request($method, $url, $options)->getBody()->getContents();
            $this->log([__LINE__, __METHOD__ . '-1', $url, $rs]);
            if ($withJson) {
                $rs = json_decode($rs, true);
            }
            return $rs;
        } catch (\GuzzleHttp\Exception\BadResponseException $ex) {
            $response = $ex->getResponse();
            $rs = (string) $response->getBody();
            $this->log([__LINE__, __METHOD__ . '-2', $url, $rs]);
            if ($withJson) {
                $rs = json_decode($rs, true);
            }
            return $rs;
        }
    }
    // Tính tiền đơn hàng theo hình thức vận chuyển
    // fly: Giao Hàng Nhanh
    // road: Giao Hàng Tiết Kiếm
    public function getPriceByServiceCode($data, $serivceCode)
    {
        $data['transport'] = $serivceCode;
        return $this->callRequest('get',  "/services/shipment/fee?" . http_build_query($data));
    }
    ///
    // $codeShip = 'ship_ghht';
    // $textShip = "Giao Hàng Hỏa Tốc";
    // $codeShip = 'ship_ghtk';
    // $textShip = "Giao Hàng Tiết Kiệm";
    // $codeShip = 'ship_ghn';
    // $textShip = "Giao Hàng Nhanh";
    public function getPriceAsyncByServiceCode($data, $serivceCode, $codeShip, $textShip)
    {
        $data['transport'] = $serivceCode;
        return $this->client->requestAsync('get',  "/services/shipment/fee?" . http_build_query($data))->then(function ($response) use ($codeShip, $textShip) {
            $rs = json_decode($response->getBody()->getContents(), true);
            $rateId = uniqid("rateId", true);
            $price = isset($rs['fee']['fee']) ? $rs['fee']['fee'] : 0;
            return [
                'id' => $rateId,
                'price' => $price,
                'name' => $textShip,
                'company_name' => $this->getName(),
                'shipment_id' => '',
                'type' => $codeShip,
                $codeShip => $price
            ];
        });
    }
    public function getPriceAll($data)
    {
        $ship = [
            [
                'textShip' => "Giao Hàng Tiết Kiếm",
                'codeShip' => 'ship_ghtk',
                'codeService' => 'road'
            ],
            [
                'textShip' => "Giao Hàng Nhanh",
                'codeShip' => 'ship_ghn',
                'codeService' => 'fly'
            ]
        ];
        foreach ($ship as $item) {
            yield $this->getPriceAsyncByServiceCode($data, $item['codeService'], $item['codeShip'], $item['textShip']);
        }
    }
    private function getDataShip($data)
    {
        return [
            "pick_address" => $data['address_from']->address,
            "pick_province" => $data['address_from']->state_name,
            "pick_district" => $data['address_from']->city_name,
            "address" => $data['address_to']['address'],
            "province" => $data['address_to']['state_name'],
            "district" => $data['address_to']['city_name'],
            "weight" => $data['weight'],
            "value" => $data['order_total'],
            // "value" => 0,
            // "transport" => $transport,
            "deliver_option" => "none",
            "tags" => [1]
        ];
    }
    public function callPriceAll($data)
    {
        $dataShip = $this->getDataShip($data);
        return $this->getPriceAll($dataShip);
    }
    // Create order
    public function createShipmentByOrder($orderData, $addressOrigin)
    {
        $this->log([__LINE__, 'createShipmentByOrder:before', $orderData]);

        $products = $orderData->products->map(function ($item) {
            return [
                'weight' => $item->weight == 0 ? 0.1 : $item->weight,
                'name' => $item->product_name,
                'product_code' => $item->product->sku,
                'quantity' => $item->qty
            ];
        });

        $transport = 'road';
        if ($orderData->shipping_option === 'ship_ghn') {
            $transport = 'fly';
        }
        $address = $orderData->address;
        $orderDetail = array(
            "id" => strval($orderData->id),
            //Địa chỉ nhận hàng
            "pick_name" =>  $addressOrigin['name'],
            "pick_address" =>  $addressOrigin['address'],
            "pick_province" =>  $addressOrigin->state_name,
            "pick_district" => $addressOrigin->city_name,
            "pick_ward" => $addressOrigin->ward_name,
            "pick_tel" =>  $addressOrigin['phone'],
            ///Địa chỉ giao hàng
            "tel" => $address->phone,
            "name" => $address->name,
            "address" => $address->address,
            "province" =>  $address->state_name,
            "district" =>  $address->city_name,
            "ward" => $address->ward_name,
            //
            "hamlet" => "Khác",
            "is_freeship" => "0",
            "pick_date" => Carbon::now()->format('Y-m-d'), // ngày lấy hàng
            "pick_money" => $orderData->amount - $orderData->shipping_amount, //Tổng số tiền đơn hàng(bào gồm phí ship)
            "note" => $orderData->description,
            "value" =>  round($orderData->sub_total),
            "transport" => $transport,
            "pick_option" => "cod",
            "deliver_option"  => "none",
            "pick_session" => 2,
            "tags" => [1]
        );
        $order = [
            "products" => $products,
            "order" => $orderDetail
        ];
        $rs = $this->callRequest('POST',  "/services/shipment/order/?ver=1.5", [
            'body' => json_encode($order),
        ]);

        if (isset($rs['success']) && $rs['success']) {
            return $rs['order']['label'];
        } else {
            if (!empty($rs['error_code'])) {
                return [
                    'success' => false,
                    'message' => isset($rs['message']) ? $rs['message'] : 'Đơn hàng chưa được đăng ký thành công.'
                ];
            }
            if (isset($rs["error"]["code"]) && $rs["error"]["code"] == "ORDER_ID_EXIST") {
                return $rs["error"]["ghtk_label"];
            }
            return [
                'success' => false,
                'message' => isset($rs['message']) ? $rs['message'] : 'Đơn hàng chưa được đăng ký thành công.'
            ];
        }
    }
    /*
     * Hủy đơn hàng
     * https://docs.giaohangtietkiem.vn/?php#h-y-n-h-ng
     */
    public function cancelOrder($order_no)
    {
        return $this->callRequest('POST',  "/services/shipment/cancel/" . $order_no);
    }
    /*
     * Trạng thái đơn hàng
     * @param : order_no
     * https://docs.giaohangtietkiem.vn/?php#tr-ng-th-i-n-h-ng
     */
    public function getShipmentOrder($order_no)
    {
        return $this->callRequest('GET',  "/services/shipment/v2/" . $order_no);
    }
    /*
     * In đơn hàng
     * https://docs.giaohangtietkiem.vn/?php#in-nh-n-n-h-ng
     */
    public function printOrder($order_no)
    {
        return $this->callRequest('GET',  "/services/label/" . $order_no, [], false);
    }
}
