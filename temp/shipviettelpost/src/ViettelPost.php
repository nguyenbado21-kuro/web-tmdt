<?php

namespace Botble\ShipViettelPost;

use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ViettelPost
{
    private $cUsername;
    private $cPassword;
    private $cHost;
    private $client;
    private const KEY_CACHE_TOKEN = 'key_viettelpost_token';
    public function getName()
    {
        return "SHIP_VIETTEL_POST";
    }
    public function __construct()
    {
        $this->cUsername = setting('shipping_shipviettelpost_user_name');
        $this->cPassword = setting('shipping_shipviettelpost_password');
        $this->cHost = setting('shipping_shipviettelpost_host_key');
        $this->client = new Client([
            // 'base_uri' => $this->cHost,
            'verify' => false,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);
        $this->getLogin();
    }
    protected $token;
    private function getUrl($url)
    {
        return $this->cHost . $url;
    }
    public function getToken()
    {
        return $this->token;
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
            $this->log([__LINE__, __METHOD__ . '-1', $url, $options]);
            $response = $this->client->request($method, $this->getUrl($url), $options);
            $rs = $response->getBody()->getContents();
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
    public function getLogin()
    {
        if (Cache::has(self::KEY_CACHE_TOKEN)) {
            $this->token = Cache::get(self::KEY_CACHE_TOKEN);
            Log::info([__CLASS__, "Get token from cache: " . $this->token]);
            $this->client = new Client([
                // 'base_uri' => $this->cHost,
                'verify' => false,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'token' => $this->token
                ]
            ]);
            return;
        }
        $rs = $this->callRequest('POST', '/user/Login', [
            'body' => json_encode([
                "USERNAME" => $this->cUsername,
                "PASSWORD" => $this->cPassword
            ])
        ]);
        if ($rs && isset($rs['data']['token'])) {
            $this->token = $rs['data']['token'];
            Cache::put(self::KEY_CACHE_TOKEN, $this->token, 60 * 1);
            Log::info([__CLASS__, "Get token from cache2: " . $this->token]);
            $this->client = new Client([
                // 'base_uri' => $this->cHost,
                'verify' => false,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'token' => $this->token
                ]
            ]);
        }
    }
    public function listBuuCucVTP()
    {
        return $this->callRequest('GET', '/categories/listBuuCucVTP');
    }

    public function listService()
    {
        return $this->callRequest('POST', '/categories/listService', [
            'body' => json_encode([
                "TYPE" => 2
            ])
        ]);
    }

    public  function getProvince($provinceId = -1)
    {
        // -1: get All
        return $this->callRequest("GET", '/categories/listProvince?provinceId=' . $provinceId);
    }

    public function getDistrict($provinceId = -1)
    {
        // -1: get All
        return $this->callRequest('GET', '/categories/listDistrict?provinceId=' . $provinceId);
    }

    public function getWard($districtId = -1)
    {
        // -1: get All
        return $this->callRequest('GET', '/categories/listWards?districtId=' . $districtId);
    }

    public function getListKhoHang()
    {
        return $this->callRequest('GET', '/user/listInventory');
    }
    // In đơn hàng vận chuyển
    public function printOrder($order_no)
    {
        $expiry_time = Carbon::now()->addMinutes(10)->getPreciseTimestamp(3);
        $rs = $this->callRequest('POST', '/order/printing-code', [
            'body' => json_encode([
                'EXPIRY_TIME' =>  $expiry_time,
                'ORDER_ARRAY' => [
                    $order_no
                ]
            ])
        ]);
        if (isset($rs['error']) && !$rs['error'] && isset($rs['message']) && $rs['message']) {
            $content = file_get_contents('https://digitalize.viettelpost.vn/DigitalizePrint/report.do?type=1&bill=' . $rs['message'] . '&showPostage=1');
            $content =  str_replace('./', 'https://digitalize.viettelpost.vn/DigitalizePrint/', $content);
            $content =  str_replace('src="images', 'src="https://digitalize.viettelpost.vn/DigitalizePrint/images', $content);
            echo $content;
            die();
        }
        return $rs;
    }
    // Tính tiền đơn hàng theo hình thức vận chuyển
    // NCOD: Giao Hàng Nhanh
    // VHT: Giao Hàng Hỏa Tốc
    // LCOD: Giao Hàng Tiết Kiếm
    public function getPriceByServiceCode($data, $serivceCode)
    {
        $data['ORDER_SERVICE_ADD'] = "";
        $data['ORDER_SERVICE'] = $serivceCode;
        $data['NATIONAL_TYPE'] = 1;
        unset($data['TYPE']);
        return $this->callRequest('POST',  '/order/getPrice', [
            'body' => json_encode($data)
        ]);
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
        $data['ORDER_SERVICE_ADD'] = "";
        $data['ORDER_SERVICE'] = $serivceCode;
        $data['NATIONAL_TYPE'] = 1;
        unset($data['TYPE']);
        return $this->client->requestAsync('POST',  $this->getUrl('/order/getPrice'), [
            'body' => json_encode($data)
        ])->then(function ($response) use ($codeShip, $textShip) {
            $rs = json_decode($response->getBody()->getContents(), true);
            $rateId = uniqid("rateId", true);
            $price = isset($rs['data']['MONEY_TOTAL']) ? $rs['data']['MONEY_TOTAL'] : 0;
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
                'textShip' => "Giao Hàng Hỏa Tốc",
                'codeShip' => 'ship_ghht',
                'codeService' => 'VHT'
            ], [
                'textShip' => "Giao Hàng Tiết Kiếm",
                'codeShip' => 'ship_ghtk',
                'codeService' => 'LCOD'
            ], [
                'textShip' => "Giao Hàng Nhanh",
                'codeShip' => 'ship_ghn',
                'codeService' => 'NCOD'
            ]
        ];
        foreach ($ship as $item) {
            yield $this->getPriceAsyncByServiceCode($data, $item['codeService'], $item['codeShip'], $item['textShip']);
        }
    }
    private function getDataShip($data)
    {
        // "province" => $data['address_to']['state_name'],
        // "district" => $data['address_to']['city_name'],
        $data_raw = [];
        $data_raw['SENDER_DISTRICT'] = $data['address_from']->city;
        $data_raw['SENDER_PROVINCE'] = $data['address_from']->state;
        $data_raw['RECEIVER_DISTRICT'] = $data['address_to']['city'];
        $data_raw['RECEIVER_PROVINCE'] = $data['address_to']['state'];
        // Loại hàng hóa:
        // TH: Thư
        // HH: Hàng
        $data_raw['PRODUCT_TYPE'] = "HH";
        $data_raw['PRODUCT_WEIGHT'] = $data['weight'];
        $data_raw['PRODUCT_PRICE'] = $data['order_total'];
        $data_raw['MONEY_COLLECTION'] = $data['order_total'];
        // Loại bảng giá
        // 0: Bảng giá quốc tế
        // 1: Bảng giá trong nước
        $data_raw['TYPE'] = 1;
        return $data_raw;
    }
    public function callPriceAll($data)
    {
        $dataShip = $this->getDataShip($data);
        return $this->getPriceAll($dataShip);
    }

    // Create order
    public function createShipmentByOrder($orderData, $addressOrigin)
    {
        $this->log([__METHOD__, __LINE__, "createShipmentByOrder:before", $orderData]);
        $data_raw = [];
        $prod_quantity = 0;
        $prod_weight = 0;
        $product_name = "";
        $products =  $orderData->products->map(function ($item) use (&$prod_quantity, &$prod_weight, &$product_name) {
            $prod_quantity += $item->qty;
            $prod_weight += $item->weight == 0 ? 0.1 : $item->weight;
            if (empty($product_name)) {
                $product_name = $item->product_name . " - " . $item->product->sku;
            }
            return [
                'PRODUCT_WEIGHT' => $item->weight == 0 ? 0.1 : $item->weight,
                'PRODUCT_NAME' => $item->product_name,
                'product_code' => $item->product->sku,
                'PRODUCT_QUANTITY' => $item->qty,
                'PRODUCT_PRICE' => (int)$item->price
            ];
        });
        $address = $orderData->address;
        $orderService = "LCOD";
        switch ($orderData->shipping_option) {
            case "ship_ghn": //Giao Hàng Nhanh
                $orderService = "NCOD";
                break;
            case "ship_ghht": //Giao Hàng Hỏa Tốc
                $orderService = "VHT";
                break;
            case "ship_ghtk": //Giao Hàng Tiết Kiệm
                $orderService = "LCOD";
                break;
            default:
        }
        $data_raw['GROUPADDRESS_ID'] = 14185386;
        $data_raw['ORDER_NUMBER'] = $orderData->id;
        $data_raw['SENDER_FULLNAME'] = $addressOrigin['name'];
        $data_raw['SENDER_PHONE'] = $addressOrigin['phone'];
        $data_raw['SENDER_ADDRESS'] = $addressOrigin->full_address;
        // $data_raw['SENDER_PROVINCE'] = (int)$addressOrigin['state'];
        // $data_raw['SENDER_DISTRICT'] = (int)$addressOrigin['city'];
        // $data_raw['SENDER_WARDS'] = (int)$addressOrigin['ward'];

        $data_raw['RECEIVER_FULLNAME'] = $address->name;
        $data_raw['RECEIVER_PHONE'] = $address->phone;
        $data_raw['RECEIVER_ADDRESS'] = $address->full_address;
        // $data_raw['RECEIVER_PROVINCE'] = (int)$address->state;
        // $data_raw['RECEIVER_DISTRICT'] = (int) $address->city;
        // $data_raw['RECEIVER_WARDS'] = (int) $address->ward;

        $data_raw['PRODUCT_NAME'] =  $product_name;
        $data_raw['PRODUCT_DESCRIPTION'] = '';
        $data_raw['PRODUCT_QUANTITY'] = $prod_quantity;
        $data_raw['PRODUCT_PRICE'] = (int)$orderData->amount;
        $data_raw['PRODUCT_WEIGHT'] = $prod_weight;
        $data_raw['PRODUCT_TYPE'] = "HH";

        // Loại vận đơn
        // 1. Không thu hộ
        // 2. Thu hộ tiền hàng và tiền cước
        // 3. Thu hộ tiền hàng
        // 4. Thu hộ tiền cước

        $data_raw['ORDER_PAYMENT'] = 2;
        $data_raw['ORDER_SERVICE'] = $orderService;
        $data_raw['ORDER_SERVICE_ADD'] = '';

        $data_raw['ORDER_NOTE'] = $orderData->description ?? '';
        $data_raw['CHECK_UNIQUE'] = true;
        $data_raw['LIST_ITEM'] = $products;
        $rs = $this->callRequest('POST', "/order/createOrder", [
            'body' => json_encode($data_raw),
        ]);
        if (isset($rs['data']['ORDER_NUMBER'])) {
            return $rs['data']['ORDER_NUMBER'];
        }
        if (isset($rs['data'][0]['ORDER_NUMBER'])) {
            return $rs['data'][0]['ORDER_NUMBER'];
        }
        return [
            'success' => false,
            'message' => isset($rs['message']) ? $rs['message'] : 'Đơn hàng chưa được đăng ký thành công.'
        ];
    }
}
