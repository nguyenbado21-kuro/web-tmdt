<?php

namespace Botble\ShipGhtk;

use Botble\Ecommerce\Enums\ShippingStatusEnum;
use Botble\Ecommerce\Models\Shipment;
use Botble\Support\Services\Cache\Cache;
use Carbon\Carbon;
use EcommerceHelper;
use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Location;
use Log;

class ShipGhtk
{
    /**
     * @var string
     */
    protected $host;

    /**
     * @var string
     */
    protected $token;

    /**
     * @var string
     */
    protected $labelFileType;

    /**
     * @var Cache
     */
    protected $cache;

    /**
     * @var array
     */
    protected $packageTypes = [];

    /**
     * @var array
     */
    protected $serviceLevels = [];
    protected $origin = [];
    public const MAX_DESCRIPTION_LENGTH = 45;

    // /*
    //  * Host giao hang tiet kiem
    //  */
    // private $host = 'https://services-staging.ghtklab.com';

    // /*
    //  * Token
    //  */
    // // public $token = '0c786A5454FfEdc5308a67c5C1273241b0A90c8d';
    // public $token = '0b04bc0837a8cc2fbfad110aca8d6941a0cd0849';

    public function __construct()
    {
        $this->host = setting('shipping_shipghtk_host_key');
        $this->token = setting('shipping_shipghtk_token_key');
        $this->labelFileType = 'PDF';

        $this->currency = get_application_currency()->title;

        $this->statuses = [
            'PRE_TRANSIT' => __('Shipping Label Created'),
            'TRANSIT' => __('In Transit'),
            'DELIVERED' => __('Delivered'),
            'RETURNED' => __('Returned to Sender'),
            'FAILURE' => __('Exception'),
            'UNKNOWN' => __('Shipping Label Created'),
        ];

        $this->contentTypes = [
            'MERCHANDISE' => __('Merchandise'),
            'DOCUMENTS' => __('Documents'),
            'GIFT' => __('Gift'),
            'RETURN_MERCHANDISE' => __('Returned Goods'),
            'HUMANITARIAN_DONATION' => __('Humanitarian Donation'),
            'OTHER' => __('Other'),
        ];

        $this->insurance = false;
        $this->signature = false;
        $this->validateAddress = false;
        $this->defaultTariff = '';
        $this->origin = $this->mergeAddress(EcommerceHelper::getOriginAddress());

        $this->distanceUnit = ecommerce_width_height_unit();
        $this->massUnit = ecommerce_weight_unit();

        $this->packageTypes = config('plugins.shippo.general.package_types', []);
        $this->serviceLevels = config('plugins.shippo.general.service_levels', []);

        $this->useCache = setting('shipping_shipghtk_logging', 1);
        $this->cache = new Cache(app('cache'), self::class);
        $this->logger = Log::channel('shipghtk');
    }
    public function checkLiving()
    {
        return  $this->token != null;
    }
    /*
     * Tính phí vận chuyển
     * @param : data
     * https://docs.giaohangtietkiem.vn/?php#t-nh-ph-v-n-chuy-n
     */
    public function shipmentFee($data, string $transport = 'road')
    {
        $dataFee = array(
            "pick_address" => $data['address_from']['address'],
            "pick_province" => $data['address_from']['city'],
            "pick_district" => $data['address_from']['state'],
            "address" => $data['address_to']['address'],
            "province" => $data['address_to']['state'],
            "district" => $data['address_to']['city'],
            "weight" => ($data['parcels']['0']['weight']) / 1000,
            //"value" => $data['order_total'],
            "value" => 0,
            "transport" => $transport,
            "deliver_option" => "none",
            "tags" => [1]
            // "tags" => [1,7]
        );
        $this->log(['dataFee' => $dataFee]);
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->host . "/services/shipment/fee?" . http_build_query($dataFee),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_HTTPHEADER => [
                "Token: " . $this->token,
            ],
        ]);
        $response = curl_exec($curl);
        curl_close($curl);
        $get_result_arr = json_decode($response, true);
        if ($get_result_arr['success']) {
            return $get_result_arr;
        }

        return $get_result_arr;
    }

    /*
     * Trạng thái đơn hàng
     * @param : order_no
     * https://docs.giaohangtietkiem.vn/?php#tr-ng-th-i-n-h-ng
     */
    public function getShipmentOrder($order_no)
    {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->host . "/services/shipment/v2/" . $order_no,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_HTTPHEADER => [
                "Token: " . $this->token,
            ],
        ]);
        $response = curl_exec($curl);
        curl_close($curl);
        return $response;
    }

    /*
     * Đăng đơn hàng
     * @param : data
     * https://docs.giaohangtietkiem.vn/?php#ng-n-h-ng
     */
    public function createShipmentOrder($data)
    {

        $products = [];
        foreach ($data['items'] as $value) {
            $weight = $value['weight'] == 0 ? 0.1 : $value['weight'] / 1000;
            array_push($products, array(
                'weight' => $weight,
                // 'weight' => 0,
                'name' => $value['name'],
                'product_code' => $value['sku'],
                'quantity' => $value['qty']
            ));
        }
        $orderDetail = array(
            "id" => strval($data['order_id']),
            "pick_name" => $data['address_from']['name'],
            "pick_address" => $data['address_from']['address'],
            "pick_province" => $data['address_from']['state'],
            "pick_district" => $data['address_from']['city'],
            "pick_ward" => "",
            "pick_tel" => $data['address_from']['phone'],
            "tel" => $data['address_to']['phone'],
            "name" => $data['address_to']['name'],
            "address" => $data['address_to']['address'],
            "province" => $data['address_to']['state'],
            "district" => $data['address_to']['city'],
            "ward" => $data['address_to']['ward'],
            "hamlet" => "Khác",
            "is_freeship" => "0",
            "pick_date" => Carbon::now()->format('Y-m-d'), //"2023-03-30"
            "pick_money" => $data['order_total'],
            "note" => "Khối lượng tính cước tối đa: 1.00 kg",
            "value" => 3000000,
            "transport" => "road",
            "pick_option" => "cod",
            "deliver_option"  => "none",
            "pick_session" => 2,
            "tags" => [1]
        );
        $order = [
            "products" => $products,
            "order" => $orderDetail
        ];
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => $this->host . "/services/shipment/order/?ver=1.5",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => json_encode($order),
            CURLOPT_HTTPHEADER => array(
                "Content-Type: application/json",
                "Token: " . $this->token,
                "Content-Length: " . strlen(json_encode($order)),
            ),
        ));

        $response = curl_exec($curl);
        $response = json_decode($response, true);
        curl_close($curl);
        info('$response----------------->', [$response]);
        if ($response['success']) {
            return $response;
        } else {
            if (!empty($response['error_code'])) {
                info('[EXCEPTION][createShipmentOrder]', [$response['message']]);
                abort($response['error_code'], $response['message']);
            }
            if ($response["error"]["code"] == "ORDER_ID_EXIST") {
                $response = $this->getShipmentOrder($response["error"]["ghtk_label"]);
                $response = json_decode($response, true);
                $response['order']['fee'] = $response['order']['ship_money'];
                $response['order']['label'] = $response['order']['label_id'];
            }
            return $response;
        }
    }
    public function createShipmentByOrder($orderData)
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
        $addressOrigin = $this->origin;
        $orderDetail = array(
            "id" => strval($orderData->id),
            //Địa chỉ nhận hàng
            "pick_name" =>  $addressOrigin['name'],
            "pick_address" =>  $addressOrigin['address'],
            "pick_province" =>  $addressOrigin['state'],
            "pick_district" => $addressOrigin['city'],
            "pick_ward" => $addressOrigin['ward'],
            "pick_tel" =>  $addressOrigin['phone'],
            ///Địa chỉ giao hàng
            "tel" => $address->phone,
            "name" => $address->name,
            "address" => $address->address,
            "province" =>  $address->state,
            "district" =>  $address->city,
            "ward" => $address->ward,
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
        // return [$this->getName(), $order];
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => $this->host . "/services/shipment/order/?ver=1.5",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => json_encode($order),
            CURLOPT_HTTPHEADER => array(
                "Content-Type: application/json",
                "Token: " . $this->token,
                "Content-Length: " . strlen(json_encode($order)),
            ),
        ));

        $response = curl_exec($curl);
        curl_close($curl);
        $response = json_decode($response, true);
        info('$response----------------->', [$response]);
        if ($response['success']) {
            return $response;
        } else {
            if (!empty($response['error_code'])) {
                info('[EXCEPTION][createShipmentOrder]', [$response['message']]);
                abort($response['error_code'], $response['message']);
            }
            if ($response["error"]["code"] == "ORDER_ID_EXIST") {
                $response = $this->getShipmentOrder($response["error"]["ghtk_label"]);
                $response = json_decode($response, true);
                $response['order']['fee'] = $response['order']['ship_money'];
                $response['order']['label'] = $response['order']['label_id'];
            }
            return $response;
        }
    }
    /*
     * Hủy đơn hàng
     * https://docs.giaohangtietkiem.vn/?php#h-y-n-h-ng
     */
    public function cancelOrder($order_no)
    {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->host . "/services/shipment/cancel/" . $order_no,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_HTTPHEADER => [
                "Token: " . $this->token,
            ],
        ]);

        $response = curl_exec($curl);
        curl_close($curl);
        return $response;
    }

    /*
     * In đơn hàng
     * https://docs.giaohangtietkiem.vn/?php#in-nh-n-n-h-ng
     */
    public function printOrder($order_no)
    {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->host . "/services/label/" . $order_no,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_HTTPHEADER => [
                "Token: " . $this->token,
            ],
        ]);

        $response = curl_exec($curl);
        curl_close($curl);
        // header("Content-Disposition:attachment;filename=" . $order_no . ".pdf");
        return $response;
    }

    function getShipmentInfo($id)
    {
        $data_raw = [];

        $ch = curl_init($this->host . '/services/shipment/v2/' . $id);
        curl_setopt_array($ch, array(
            CURLOPT_POST => FALSE,
            CURLOPT_RETURNTRANSFER => TRUE,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json',
                'token: ' . $this->token
            ),
            CURLOPT_POSTFIELDS => json_encode($data_raw)
        ));
        $response = curl_exec($ch);
        $responseData = json_decode($response, TRUE);
        curl_close($ch);
        return $responseData;
    }

    /**
     * @return string
     */
    public function getName(): string
    {
        return 'SHIP_GHTK';
    }

    /**
     * @param array $address
     * @return array
     */
    public function mergeAddress(array $address): array
    {
        return array_merge($address, [
            'street1' => Arr::get($address, 'address'),
            'street2' => Arr::get($address, 'address_2'),
            'zip' => Arr::get($address, 'zip_code'),
        ]);
    }

    public function validate(): array
    {
        return [true];
    }

    protected function validateActiveApiToken(): bool
    {

        return true;
    }

    /**
     * @param array $params
     * @param bool $suggest
     * @return array
     */
    public function getRates(array $params, bool $suggest = true): array
    {
        $this->log([__LINE__, 'getRates: ' . json_encode($params)]);
        $prepareParams = $this->getPrepareParams($params);
        $newResponse = $this->getCacheOrNewRates($prepareParams);
        if (!Arr::get($newResponse, 'shipment.rates', []) && $suggest && Arr::get($prepareParams, 'extra.COD', [])) {
            $suggestParams = $prepareParams;
            Arr::forget($suggestParams, 'extra.COD');

            $suggestResponse = $this->getCacheOrNewRates($suggestParams);
            if ($rates = Arr::get($suggestResponse, 'shipment.rates', [])) {
                foreach ($rates as &$rate) {
                    $rate['disabled'] = true;
                    $rate['error_message'] = __('Not available in COD payment option.');
                }

                Arr::set($newResponse, 'shipment.rates', $rates);
            }
        }
        return $newResponse;
    }

    /**
     * @param array $params
     * @return array
     */
    public function getCacheOrNewRates(array $params): array
    {
        $cacheKey = $this->getCacheKey($params);
        $response = $this->getCacheValue($cacheKey);
        if (!$response) {
            if (!$params['address_from'] || !$params['address_to']) {
                $this->log([__LINE__, 'Cannot detect address, ' . json_encode($params)]);
            } else {
                $requestParams = $this->getRatesParams($params);
                $response = $this->createShipment($requestParams);
            }
        } else {
            $this->log([__LINE__, 'Found previously returned rates, so return them']);
        }

        $this->log([__LINE__, print_r($response, true)]);

        return $this->getRatesResponse($response, $params);
    }

    /**
     * @param array $params
     * @param array|null
     */
    public function createShipment(array $params)
    {
        $cacheKey = $this->getCacheKey($params);
        $response = $this->getCacheValue($cacheKey);
        if (!$response) {
            $params = array_merge([
                'async' => false,
                'mode' => 'production',
                'extra' => [
                    'is_return' => false,
                ],
            ], $params);

            try {
                if ($params['isCreate']) {
                    $response = $this->createShipmentOrder($params);
                    $response = $this->getOptionsShip($params, $response['order']['label']);
                } else {
                    $response = $this->getOptionsShip($params);
                }
                $this->log([__LINE__, 'Cache shipment for the future']);
                $this->setCacheValue($response['shipmentId'], $response);
            } catch (Exception $ex) {
                report($ex);
            }
        } else {
            $this->log([__LINE__, 'Found previously returned rates, so return them']);
        }
        return $response;
    }
    protected function getOptionsShip(array $params, string $shipmentId = '')
    {
        $rateId = uniqid("rateId", true);
        $responseshipmentFee = $this->shipmentFee($params, 'road');
        $this->log([__LINE__, "getOptionsShip", $responseshipmentFee]);
        $result = [];
        if (isset($responseshipmentFee['fee']['fee'])) {
            $priceRoad = $responseshipmentFee['fee']['fee'];
            $result['ship_ghtk'] = [
                'id' => $rateId,
                'price' => $priceRoad,
                'name' => 'Giao hàng tiết kiệm',
                'company_name' => $this->getName(),
                'shipment_id' => $shipmentId,
                'type' => 'ship_ghtk',
                'ship_ghtk' => $priceRoad
            ];
        }

        $responseshipmentFee = $this->shipmentFee($params, 'fly');
        if (isset($responseshipmentFee['fee']['fee'])) {
            $priceFly = $responseshipmentFee['fee']['fee'];
            $result['ship_ghn'] = [
                'id' => $rateId,
                'price' => $priceFly,
                'name' => 'Giao hàng nhanh',
                'company_name' => $this->getName(),
                'shipment_id' => $shipmentId,
                'type' => 'ship_ghn',
                'ship_ghn' => $priceFly
            ];
        }
        $response['rates'] = $result;
        $response['shipmentId'] = $shipmentId;
        return $response = array_merge($response, $params);
    }
    /**
     * @param array $rates
     * @return array
     */
    protected function ratesByCurrency(array $rates): array
    {
        $rates = collect($rates)
            ->filter(function ($rate) {
                return in_array($this->currency, [$rate['currency'], $rate['currency_local']]);
            })
            ->toArray();

        $newRates = [];
        foreach ($rates as $key => $rate) {
            $newRates[$key] = $rate;

            if ($rate['currency'] == $this->currency) {
                $newRates[$key]['price'] = $rate['amount'];
            } elseif ($rate['currency_local'] == $this->currency) {
                $newRates[$key]['price'] = $rate['amount_local'];
            }
        }

        return $newRates;
    }

    /**
     * @param array $logs
     * @return self
     */
    public function log($logs): self
    {
        FacadesLog::info(__CLASS__, $logs);
        return $this;
    }

    /**
     * @param array $inParams
     * @return array
     */
    public function getPrepareParams(array $inParams): array
    {
        $params['isCreate'] = $inParams['isCreate'];
        $params['order_id'] = $inParams['order_id'];
        $params['order_total'] = $inParams['order_total'];
        $params['extra'] = Arr::get($inParams, 'extra', []);
        $params['address_from'] = $this->getRequestedOrigin($inParams);
        $params['address_from'] = $this->prepareAddress($params['address_from']);
        $params['address_to'] = [];

        if ($addressTo = Arr::get($inParams, 'address_to')) {
            $params['address_to'] = $this->prepareAddress($addressTo);
        }

        $params['parcels'] = $this->prepareParcelInfo($inParams);
        $params['items'] = Arr::get($inParams, 'items', []);
        return $params;
    }

    /**
     * @param array $params
     * @return string
     */
    public function getCacheKey(array $params): string
    {
        $params['api'] = $this->getApiKey();

        $jsonData = json_encode($params);
        $cacheKey = md5($jsonData) . '_production';

        return $cacheKey;
    }

    /**
     * @param array $params
     * @return array
     */
    protected function getRatesParams(array $inParams): array
    {
        $params = [
            'async' => false,
            'mode' => 'production',
            'order_id' => $inParams['order_id'],
            'order_total' => $inParams['order_total'],
            'isCreate' => $inParams['isCreate'],
            'extra' => [
                'is_return' => false,
            ],
        ];

        if ($isReturn = Arr::get($inParams, 'extra.is_return')) {
            $params['extra']['is_return'] = (bool) $isReturn;
        }

        if ($orderId = Arr::get($inParams, 'extra.order_id')) {
            $params['extra']['reference_1'] = $orderId;
            $params['metadata'] = sprintf('Order %s', $orderId);
        }

        if ($orderToken = Arr::get($inParams, 'extra.order_token')) {
            $params['metadata'] = sprintf('Order Token %s', $orderToken);
        }

        if ($orderNumber = Arr::get($inParams, 'order_number')) {
            $params['extra']['reference_2'] = $orderNumber;
        }

        if ($this->isInsuranceRequested($inParams) && !empty($inParams['value'])) {
            $params['extra']['insurance'] = [
                'amount' => $inParams['value'],
                'currency' => $this->currency,
            ];
        }

        if ($this->isSignatureRequested($inParams)) {
            $params['extra']['signature_confirmation'] = 'STANDARD';
        }

        if ($cod = Arr::get($inParams, 'extra.COD', [])) {
            $params['extra']['COD'] = $cod;
        }

        if ($addressFrom = Arr::get($inParams, 'address_from')) {
            $this->log([__LINE__, 'From Address: ' . json_encode($addressFrom)]);
            $params['address_from'] = $this->getCachedAddress($addressFrom);
        }

        if ($addressTo = Arr::get($inParams, 'address_to')) {
            $this->log([__LINE__, 'To Address: ' . json_encode($addressTo)]);
            $params['address_to'] = $this->getCachedAddress($addressTo);
        }

        $parcelsInfo = Arr::only($params, ['extra', 'metadata']) ?: [];
        $parcelsInfo['parcels'] = Arr::get($inParams, 'parcels') ?: [];

        $params['parcels'] = $this->getCachedParcelInfo($parcelsInfo);

        if (
            isset($inParams['address_from']['country'])
            && isset($inParams['address_to']['country'])
            && $inParams['address_from']['country'] != $inParams['address_to']['country']
        ) {
            $params['customs_declaration'] = $this->getCachedCustomsInfo($inParams);
        }
        $params['items'] =  $inParams['items'];
        return $params;
    }

    /**
     * @param array $inParams
     * @return bool
     */
    protected function isInsuranceRequested(array $inParams): bool
    {
        return true;
    }

    /**
     * @param array $inParams
     * @return bool
     */
    protected function isSignatureRequested(array $inParams): bool
    {
        return true;
    }

    /**
     * @param array $inParams
     * @return array
     */
    protected function getRequestedOrigin(array $inParams): array
    {
        $origin = Arr::get($inParams, 'origin');
        return $this->mergeAddress($origin);
    }

    /**
     * @param array $inParams
     * @return array|string
     */
    protected function getCachedParcelInfo(array $inParams)
    {
        $cacheKey = $this->getCacheKey($inParams);
        $parcelId = $this->getCacheValue($cacheKey);
        if (!empty($parcelId)) {
            $this->log([__LINE__, 'Found previous cached parcel ID: ' . $parcelId . ', so re-use it']);

            return $parcelId;
        }

        return $inParams['parcels'];
    }

    /**
     * @param array $inParams
     * @return array
     * chuan bi thong tin buu kien
     */
    protected function prepareParcelInfo(array $inParams): array
    {
        $length = 0;
        $width = 0;
        $height = 0;

        foreach (Arr::get($inParams, 'items', []) as $item) {
            $_length = $item['length'] * $item['qty'];
            $_height = $item['height'] * $item['qty'];
            $length = $length > $_length ? $length : $_length;
            $height = $height > $_height ? $length : $_height;
            $width += $item['wide'] * $item['qty'];
        }

        $parcel = [
            'weight' => round(Arr::get($inParams, 'weight', 0), 2),
            'length' => round($length, 2),
            'width' => round($width, 2),
            'height' => round($height, 2),
            'distance_unit' => $this->distanceUnit,
            'mass_unit' => $this->massUnit,
        ];

        if (!empty($inParams['type']) && $inParams['type'] != 'parcel' && isset($this->packageTypes[$inParams['type']])) {
            $parcel['template'] = $inParams['type'];
        }

        return [$parcel];
    }

    public function getCacheValue($cacheKey)
    {
        if ($this->useCache) {
            return $this->cache->get($cacheKey);
        }
    }

    public function setCacheValue($cacheKey, $value)
    {
        if ($cacheKey) {
            return $this->cache->put($cacheKey, $value);
        }

        return true;
    }

    protected function getCachedAddress($options)
    {
        $cacheKey = $this->getCacheKey($options);
        $addrId = $this->getCacheValue($cacheKey);
        if (!empty($addrId)) {
            $this->log([__LINE__, 'Found previous cached address ID: ' . $addrId . ', so re-use it']);

            return $addrId;
        }

        return $options;
    }

    protected function prepareAddress($options)
    {
        $addr = $this->mergeAddress($options);
        $validator = Validator::make($addr, $this->getAddressFromValidationRules());
        if ($validator->fails()) {
            $this->log([__LINE__, 'Address is invalid ' . json_encode($addr)]);

            return [];
        }
        return $this->afterPrepareAddress($addr);
    }

    protected function afterPrepareAddress(array $addr)
    {
        if (EcommerceHelper::loadCountriesStatesCitiesFromPluginLocation()) {
            if (isset($addr['ward'])) {
                $ward_id = $addr['ward'];
                $ward = Location::getWardById($ward_id);
                if ($ward) {
                    $addr['ward'] = $ward->name;
                    $addr['city'] = $ward->city->name;
                    $addr['state'] = $ward->city->state->name;
                    $addr['country'] = $ward->city->state->country->code;
                }
            } else {
                $city_id = $addr['city'];
                $city = Location::getCityById($city_id);
                if ($city) {
                    $addr['city'] = $city->name;
                    $addr['state'] = $city->state->name;
                    $addr['country'] = $city->state->country->code;
                }
            }
        }

        return $addr;
    }

    protected function getAddressFromValidationRules()
    {
        return [];
    }

    protected function getValidationErrors($addressField, $addressType)
    {
        if (empty($addressField['validation_results']) || !empty($addressField['validation_results']['is_valid'])) {
            return [];
        }

        $this->log([__LINE__, 'Address is invalid: ' . print_r($addressField['validation_results'], true)]);

        $validationErrors = [];

        foreach ($addressField['validation_results']['messages'] as $error) {
            $errorMessage = $this->getErrorMessage($error);
            $validationErrors[$addressType][] = $errorMessage;
        }

        return $validationErrors;
    }

    protected function getErrorMessage($error)
    {
        if (isset($error['object_id']) || isset($error['results']) || isset($error['tracking_number'])) {
            return '';
        }

        if (isset($error['__all__'])) {
            $error = $error['__all__'];
        }

        if (is_string($error)) {
            return $error;
        }

        if (isset($error['text'])) {
            return $error['text'];
        }

        $message = '';
        if (is_array($error)) {
            foreach ($error as $key => $val) {
                if (!empty($message)) {
                    $message .= "\n";
                }

                if (!is_numeric($key)) {
                    $message .= $key . ' -> ';
                }

                $message .= $this->getErrorMessage($val);
            }
        }

        return trim($message);
    }

    protected function getCachedCustomsInfo(array $inParams)
    {
        $customsInfo = $this->prepareCustomsInfo($inParams);

        $cacheKey = $this->getCacheKey($customsInfo);
        $customsInfoId = $this->getCacheValue($cacheKey);
        if (!empty($customsInfoId)) {
            $this->log([__LINE__, 'Found previous cached customs info ID: ' . $customsInfoId . ', so re-use it']);

            return $customsInfoId;
        }

        return $customsInfo;
    }

    protected function prepareCustomsInfo(array $inParams)
    {
        $customsInfo = [
            'certify' => true,
            'non_delivery_option' => 'RETURN',
            'certify_signer' => trim(Arr::get($inParams, 'address_from.name') ?: Arr::get($inParams, 'address_from.company')) ?: 'Shipper',
            'contents_type' => 'MERCHANDISE',
        ];

        if (!empty($inParams['order_number'])) {
            $customsInfo['invoice'] = $inParams['order_number'];
        }

        if (!empty($inParams['contents']) && !empty($this->contentTypes[$inParams['contents']])) {
            $customsInfo['contents_type'] = $inParams['contents'];
        }

        if (isset($inParams['description'])) {
            $customsInfo['contents_explanation'] = $inParams['description'];
        }

        $defaultOriginCountry = '';
        if (isset($inParams['address_from']['country'])) {
            $defaultOriginCountry = strtoupper($inParams['address_from']['country']);
        }

        if (!empty($inParams['items']) && is_array($inParams['items'])) {
            $customsInfo['items'] = $this->prepareCustomsItems($inParams['items'], $defaultOriginCountry);
        }

        $this->log([__LINE__, 'Customs Info: ' . print_r($customsInfo, true)]);

        return $customsInfo;
    }

    protected function prepareCustomsItems(array $itemsInParcel, $defaultOriginCountry)
    {
        $customsItems = [];

        foreach ($itemsInParcel as $itemInParcel) {
            if (empty($itemInParcel['country'])) {
                $itemInParcel['country'] = $defaultOriginCountry;
            }

            $customsItem = $this->prepareCustomsItem($itemInParcel);
            if (!empty($customsItem)) {
                $customsItems[] = $customsItem;
            }
        }

        return $customsItems;
    }

    protected function prepareCustomsItem($itemInParcel)
    {
        if (
            empty($itemInParcel['name']) ||
            !isset($itemInParcel['weight']) ||
            empty($itemInParcel['qty']) ||
            !isset($itemInParcel['price'])
        ) {
            $this->log([__LINE__, 'Item is invalid, so skip it ' . print_r($itemInParcel, true)]);

            return false;
        }

        $value = $itemInParcel['price'] * $itemInParcel['qty'];

        $tariff = $this->defaultTariff;
        if (!empty($itemInParcel['tariff'])) {
            $tariff = $itemInParcel['tariff'];
        }

        $description = preg_replace('/[^\w\d\s]/', '?', utf8_decode($itemInParcel['name']));

        $customsItem = [
            'description' => Str::limit($description, self::MAX_DESCRIPTION_LENGTH),
            'quantity' => $itemInParcel['qty'],
            'value_amount' => round($value, 3),
            'value_currency' => $this->currency,
            'net_weight' => round($itemInParcel['weight'], 3),
            'mass_unit' => $this->massUnit,
            'origin_country' => $itemInParcel['country'],
            'tariff_number' => $tariff,
        ];

        return $customsItem;
    }

    protected function getShipmentResponse($response, array $params)
    {

        if ($addressFrom = Arr::get($response, 'address_from')) {
            $validationErrors = $this->getValidationErrors($addressFrom, 'origin');
            if (!empty($validationErrors)) {
                $response['address_from']['object_id'] = null;
            }
        }

        if ($addressTo = Arr::get($response, 'address_to')) {
            if ($this->validateAddress && empty($addressTo['is_complete'])) {
                $validationErrors['destination'][] = __('Address appears to be incomplete');

                $this->log([__LINE__, 'Address is incomplete']);
            }

            $validationErrors = $this->getValidationErrors($addressTo, 'destination');
            if (!empty($validationErrors)) {
                $response['address_to']['object_id'] = null;
            }
        }

        $shipmentId = $this->getShipmentId($response, $params);



        $newResponse = [
            'shipment' => [
                'id' => $shipmentId,
                'rates' => $this->sortRates($response == null ? [] : $response['rates']),
            ],
        ];

        if (!empty($validationErrors)) {
            $newResponse['validation_errors'] = $validationErrors;
        }

        return $newResponse;
    }

    /**
     * @param array $rates
     * @return array
     */
    public function sortRates(array $rates): array
    {
        uasort($rates, function ($rate1, $rate2) {
            return $rate1['price'] > $rate2['price'] ? 1 : -1;
        });

        return $rates;
    }

    protected function getRatesResponse($response, array $params)
    {
        $newResponse = $this->getShipmentResponse($response, $params);
        if (Arr::get($newResponse, 'shipment.id')) {
            $this->setShipmentCacheValues($response, $params);
        }

        return $newResponse;
    }

    protected function setShipmentCacheValues($response, array $params)
    {
        if (($addressFrom = Arr::get($response, 'address_from')) && $this->isResponseObjectValid($addressFrom)) {
            $addrId = $addressFrom['object_id'];
            $this->log([__LINE__, 'Cache from address ID: ' . $addrId]);

            $cacheKey = $this->getCacheKey(Arr::get($params, 'address_from'));
            $this->setCacheValue($cacheKey, $addrId);
        }

        if (($addressTo = Arr::get($response, 'address_to')) && $this->isResponseObjectValid($addressTo)) {
            $addrId = $addressTo['object_id'];
            $this->log([__LINE__, 'Cache to address ID: ' . $addrId]);

            $cacheKey = $this->getCacheKey(Arr::get($params, 'address_to'));
            $this->setCacheValue($cacheKey, $addrId);
        }

        if (($parcel = Arr::get($response, 'parcels.0')) && $this->isResponseObjectValid($parcel)) {
            $parcelId = $parcel['object_id'];
            $this->log([__LINE__, 'Cache parcel ID: ' . $parcelId]);

            $cacheKey = $this->getCacheKey(Arr::get($params, 'parcels.0'));

            $this->setCacheValue($cacheKey, $parcelId);
        }
    }

    protected function isResponseObjectValid($object): bool
    {
        $isValid = false;

        if (!empty($object['object_id']) && !empty($object['object_state']) && $object['object_state'] == 'VALID') {
            $isValid = true;
        }

        return $isValid;
    }

    protected function getShipmentId($response, array $params = []): string
    {
        $shipmentId = '';
        if (!empty($response['rates']['ship_ghtk']['shipment_id'])) {
            $shipmentId = $response['rates']['ship_ghtk']['shipment_id'];
        }
        return $shipmentId;
    }

    protected function getApiKey()
    {
        return $this->token;
    }

    public function canCreateTransaction(Shipment $shipment): bool
    {
        $order = $shipment->order;
        if (
            $order && $order->id && $order->shipping_method->getValue() == SHIPGHTK_SHIPPING_METHOD_NAME
            && in_array($shipment->status->getValue(), [ShippingStatusEnum::APPROVED, ShippingStatusEnum::PENDING])
        ) {
            return true;
        }

        return false;
    }

    public function createTransaction(string $rateId): array
    {
        return [true];
    }

    public function retrieveRate(string $rateId)
    {
    }

    public function retrieveShipment(string $shipmentId)
    {
        $cacheKey = $this->getCacheKey(['function' => __FUNCTION__, 'shipment_id' => $shipmentId]);
        $response = $this->getCacheValue($cacheKey);
        if (!$response) {
        }

        return $response;
    }
    public function ConvertStatus($status)
    {
        return match ($status) {
            -1, 7, 8, 9, 11, 13, 20, 21 => ShippingStatusEnum::CANCELED,
            1 => ShippingStatusEnum::NOT_APPROVED,
            2, 12 => ShippingStatusEnum::APPROVED,
            3, 4, 10 => ShippingStatusEnum::DELIVERING,
            5, 6 => ShippingStatusEnum::DELIVERED,
            default => null,
        };
    }
    public function labelPrite()
    {
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => "https://services.giaohangtietkiem.vn/services/label/S1.8663516?original=portrait&page_size=A6",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_HTTPHEADER => array(
                "Token: APITokenSample-ca441e70288cB0515F310742",
            ),
        ));

        $response = curl_exec($curl);
        curl_close($curl);

        echo 'Response: ' . $response;
    }
}
