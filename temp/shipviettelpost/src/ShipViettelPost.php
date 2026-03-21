<?php

namespace Botble\ShipViettelPost;

use Botble\Ecommerce\Enums\ShippingStatusEnum;
use Botble\Ecommerce\Models\Shipment;
use Botble\Support\Services\Cache\Cache;
use EcommerceHelper;
use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Location;
use Log;

class ShipViettelPost
{
    private const CONTENT_TYPE = 'Content-Type: application/json';
    /**
     * @var string
     */
    protected $_USERNAME;
    /**
     * @var string
     */
    protected $_PASSWORD;
    /**
     * @var string
     */
    protected $host;

    /**
     * @var string
     */
    protected $testApiToken;

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

    public function __construct()
    {
        $this->_USERNAME = setting('shipping_shipviettelpost_user_name');
        $this->_PASSWORD = setting('shipping_shipviettelpost_password');
        $this->host = setting('shipping_shipviettelpost_host_key');
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

    private $token = null;
    private function callRequest($url, $config = [], $withToken = true, $withCheckLiving = true)
    {
        try {
            if ($withCheckLiving && !$this->checkLiving()) {
                return null;
            }
            $ch = curl_init($url);
            $arr = [
                CURLOPT_POST => false,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    self::CONTENT_TYPE
                ],
                CURLOPT_FAILONERROR => true
            ];
            foreach ($config as $key => $value) {
                $arr[$key] = $value;
            }
            if ($withToken) {
                $arr[CURLOPT_HTTPHEADER][] = 'token: ' . $this->token;
            }
            curl_setopt_array(
                $ch,
                $arr
            );
            $response = curl_exec($ch);
            if (curl_errno($ch)) {
                $error_msg = curl_error($ch);
                $this->log([__LINE__, "callRequest::curl_error", $url, $config, $error_msg]);
            }
            curl_close($ch);
            return json_decode($response, true);
        } catch (\Exception $ex) {
            $this->log([__LINE__, "callRequest::Exception", $url, $config, $ex->getMessage()]);
            return null;
        }
    }
    public function checkLiving()
    {
        if ($this->token == null) {
            $row_login = $this->getLogin();
            if ($row_login && isset($row_login) && isset($row_login['data']['token'])) {
                $this->token = $row_login['data']['token'];
            }
        }
        return $this->token != null;
    }

    private function getLogin()
    {
        try {
            return $this->callRequest($this->host . '/user/Login', [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode([
                    "USERNAME" => $this->_USERNAME,
                    "PASSWORD" => $this->_PASSWORD
                ]),
            ], false, false);
        } catch (\Exception $ex) {
            return null;
        }
    }

    public function listBuuCucVTP()
    {
        return $this->callRequest($this->host . '/categories/listBuuCucVTP');
    }

    public function listService()
    {
        return $this->callRequest($this->host . '/categories/listService', [
            CURLOPT_POSTFIELDS => json_encode([
                "TYPE" => 2
            ])
        ]);
    }

    public  function getProvince($provinceId = -1)
    {
        // -1: get All
        return $this->callRequest($this->host . '/categories/listProvince?provinceId=' . $provinceId);
    }

    public function getDistrict($provinceId = -1)
    {
        // -1: get All
        return $this->callRequest($this->host . '/categories/listDistrict?provinceId=' . $provinceId);
    }

    public function getWard($districtId = -1)
    {
        // -1: get All
        return $this->callRequest($this->host . '/categories/listWards?districtId=' . $districtId);
    }

    public function getListKhoHang()
    {
        return $this->callRequest($this->host . '/user/listInventory');
    }

    public function getPrice($data_raw, $ma_dv_chinh)
    {
        $data_raw['ORDER_SERVICE_ADD'] = "";
        $data_raw['ORDER_SERVICE'] = $ma_dv_chinh;
        $data_raw['NATIONAL_TYPE'] = 1;
        unset($data_raw['TYPE']);
        return $this->callRequest($this->host . '/order/getPrice', [
            CURLOPT_POSTFIELDS => json_encode($data_raw)
        ]);
    }

    private function getDataFee($data)
    {
        $data_raw = [];
        $data_raw['SENDER_DISTRICT'] = $data['address_from']['city_id'];
        $data_raw['SENDER_PROVINCE'] = $data['address_from']['state_id'];
        $data_raw['RECEIVER_DISTRICT'] = $data['address_to']['city_id'];
        $data_raw['RECEIVER_PROVINCE'] = $data['address_to']['state_id'];
        $data_raw['PRODUCT_TYPE'] = "HH";
        $data_raw['PRODUCT_WEIGHT'] = $data['parcels']['0']['weight'];
        $data_raw['PRODUCT_PRICE'] = $data['order_total'];
        $data_raw['MONEY_COLLECTION'] = $data['order_total'];
        $data_raw['TYPE'] = 1;
        return $data_raw;
    }

    private function createOrder($data)
    {
        $data_fee = [];
        $data_fee = $this->getDataFee($data);
        $datePrice = $this->getPriceAll($data_fee);
        $data_raw = [];

        $products = [];
        $prod_quantity = 0;
        $prod_price = 0;
        $prod_weight = 0;
        foreach ($data['items'] as $value) {
            $weight = $value['weight'] == 0 ? 0.1 : $value['weight'];
            array_push($products, array(
                'PRODUCT_WEIGHT' => $weight,
                // 'weight' => 0,
                'PRODUCT_NAME' => $value['name'],
                'PRODUCT_PRICE' => $value['price'],
                'PRODUCT_QUANTITY' => $value['qty']
            ));
            $prod_quantity = $prod_quantity + $value['qty'];
            $prod_price = $prod_price + $value['price'];
            $prod_weight = $prod_weight + $weight;
        };

        $data_raw['GROUPADDRESS_ID'] = 0;
        $data_raw['ORDER_NUMBER'] = $data['order_id'];
        $data_raw['SENDER_FULLNAME'] = $data['address_from']['name'];
        $data_raw['SENDER_PHONE'] = $data['address_from']['phone'];
        $data_raw['SENDER_ADDRESS'] = $data['address_from']['address'];
        $data_raw['SENDER_PROVINCE'] = (int)$data['address_from']['state_id'];
        $data_raw['SENDER_DISTRICT'] = (int)$data['address_from']['city_id'];
        $data_raw['SENDER_WARDS'] = 0;

        $data_raw['RECEIVER_FULLNAME'] = $data['address_to']['name'];
        $data_raw['RECEIVER_PHONE'] = $data['address_to']['phone'];
        $data_raw['RECEIVER_ADDRESS'] = $data['address_to']['address'];
        $data_raw['RECEIVER_PROVINCE'] = (int)$data['address_to']['state_id'];
        $data_raw['RECEIVER_DISTRICT'] = (int)$data['address_to']['city_id'];
        $data_raw['RECEIVER_WARDS'] = (int)$data['address_to']['ward'];

        $data_raw['PRODUCT_NAME'] = '';
        $data_raw['PRODUCT_DESCRIPTION'] = '';
        $data_raw['PRODUCT_QUANTITY'] = $prod_quantity;
        $data_raw['PRODUCT_PRICE'] = $prod_price;
        $data_raw['PRODUCT_WEIGHT'] = $prod_weight;
        $data_raw['PRODUCT_TYPE'] = "HH";

        $data_raw['ORDER_PAYMENT'] = 2;
        $data_raw['ORDER_SERVICE'] = $datePrice['0']['MA_DV_CHINH'];
        $data_raw['ORDER_SERVICE_ADD'] = '';

        $data_raw['ORDER_NOTE'] = 'cho xem hàng, không cho thử';
        $data_raw['CHECK_UNIQUE'] = true;
        $data_raw['LIST_ITEM'] = $products;
        return $this->callRequest($this->host . '/order/createOrder', [
            CURLOPT_POSTFIELDS => json_encode($data_raw)
        ]);
    }
    public function createShipmentByOrder($orderData)
    {
        $this->log([__METHOD__, __LINE__, "createShipmentByOrder:before", $orderData]);
        $data_raw = [];
        $prod_quantity = 0;
        $prod_weight = 0;
        $products =  $orderData->products->map(function ($item) use (&$prod_quantity, &$prod_weight) {
            $prod_quantity += $item->qty;
            $prod_weight += $item->weight == 0 ? 0.1 : $item->weight;
            return [
                'PRODUCT_WEIGHT' => $item->weight == 0 ? 0.1 : $item->weight,
                'PRODUCT_NAME' => $item->product_name,
                'product_code' => $item->product->sku,
                'PRODUCT_QUANTITY' => $item->qty,
                'PRODUCT_PRICE' => $item->price
            ];
        });
        $address = $orderData->address;
        $addressOrigin = $this->origin;
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
        $data_raw['GROUPADDRESS_ID'] = 0;
        $data_raw['ORDER_NUMBER'] = $orderData->id;
        $data_raw['SENDER_FULLNAME'] = $addressOrigin['name'];
        $data_raw['SENDER_PHONE'] = $addressOrigin['phone'];
        $data_raw['SENDER_ADDRESS'] = $addressOrigin['address'];
        $data_raw['SENDER_PROVINCE'] = (int)$addressOrigin['state'];
        $data_raw['SENDER_DISTRICT'] = (int)$addressOrigin['city'];
        $data_raw['SENDER_WARDS'] = 0;

        $data_raw['RECEIVER_FULLNAME'] = $address->name;
        $data_raw['RECEIVER_PHONE'] = $address->phone;
        $data_raw['RECEIVER_ADDRESS'] = $address->address;
        $data_raw['RECEIVER_PROVINCE'] = (int)$address->state;
        $data_raw['RECEIVER_DISTRICT'] = (int) $address->city;
        $data_raw['RECEIVER_WARDS'] = (int) $address->ward;

        $data_raw['PRODUCT_NAME'] = '';
        $data_raw['PRODUCT_DESCRIPTION'] = '';
        $data_raw['PRODUCT_QUANTITY'] = $prod_quantity;
        $data_raw['PRODUCT_PRICE'] = $orderData->amount;
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

        $data_raw['ORDER_NOTE'] = $orderData->description;
        $data_raw['CHECK_UNIQUE'] = true;
        $data_raw['LIST_ITEM'] = $products;
        return $this->callRequest($this->host . "/order/createOrder", [
            CURLOPT_POSTFIELDS => json_encode($data_raw),
        ]);
    }

    public function getPriceAll($data)
    {
        return $this->callRequest($this->host . '/order/getPriceAll', [
            CURLOPT_POSTFIELDS => json_encode($data)
        ]);
    }

    public function getShipmentInfo($id)
    {
        return $this->callRequest($this->host . "/order/detail-v2?o={$id}");
    }

    public function updateStatus($id, $type)
    {
        $this->callRequest($this->host . '/order/edit', [
            CURLOPT_POSTFIELDS => json_encode([
                'TYPE' => $type,
                'ORDER_NUMBER' => $id
            ])
        ]);
    }


    /**
     * @return string
     */
    public function getName(): string
    {
        return 'SHIP_VIETTEL_POST';
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
                    $response = $this->createOrder($params);
                    $this->log([__LINE__, 'createShipment-response:',  $response]);
                    if (!$response['error']) {
                        $shipmentId = $response['data']['ORDER_NUMBER'];
                    } else {
                        $shipmentId = $response['data']['0']['ORDER_NUMBER'];
                    }
                    $response = $this->getOptionsShip($params, $shipmentId);
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

    public function getOptionsShip(array $params, string $shipmentId = '')
    {
        $rateId = uniqid("rateId", true);
        $data_raw = [];
        $data_raw = $this->getDataFee($params);
        $datePrice = $this->getPriceAll($data_raw);
        // $priceRes = '';
        $description = '';
        $this->log([__LINE__, 'getOptionsShip:datePrice: ' . json_encode($data_raw)]);
        $nameShip = 'ship_viettelpost';
        foreach ($datePrice as $price) {
            switch ($price['MA_DV_CHINH']) {
                case "VHT":
                    $response = $this->getPrice($data_raw, $price['MA_DV_CHINH']);
                    $priceRes = $response['data']['MONEY_TOTAL'];
                    $nameShip = 'ship_ghht';
                    $description = "Giao Hàng Hỏa Tốc";
                    break;
                case "LCOD":
                    $response = $this->getPrice($data_raw, $price['MA_DV_CHINH']);
                    $priceRes = $response['data']['MONEY_TOTAL'];
                    $nameShip = 'ship_ghtk';
                    $description = "Giao Hàng Tiết Kiệm";
                    break;
                case "NCOD":
                    $response = $this->getPrice($data_raw, $price['MA_DV_CHINH']);
                    $priceRes = $response['data']['MONEY_TOTAL'];
                    $nameShip = 'ship_ghn';
                    $description = "Giao Hàng Nhanh";
                    break;
                default:
            }
            if (empty($priceRes)) {
                continue;
            }

            $result[$nameShip] = [
                'id' => $rateId,
                'price' => $priceRes,
                'name' => $description,
                'company_name' => $this->getName(),
                'shipment_id' => $shipmentId,
                'type' => $nameShip,
                $nameShip => $priceRes
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
        return md5($jsonData) . '_production';
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
            $params['extra']['is_return'] = (bool)$isReturn;
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
        $params['items'] = $inParams['items'];
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
            $cityId = $addr['city'];
            $city = Location::getCityById($cityId);
            if ($city) {
                $addr['city_id'] = $addr['city'];
                $addr['city'] = $city->name;
                $addr['state_id'] = $addr['state'];
                $addr['state'] = $city->state->name;
                $addr['country_id'] = $addr['country'];
                $addr['country'] = $city->state->country->code;
            }
        }

        return $addr;
    }

    protected function getAddressFromValidationRules()
    {
        return []; //EcommerceHelper::getCustomerAddressValidationRules();
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
                'rates' => $this->sortRates(($response == null || !isset($response['rates']) || !$response['rates']) ? [] : $response['rates']),
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
        if (!empty($response['rates']['ship_viettelpost']['shipment_id'])) {
            $shipmentId = $response['rates']['ship_viettelpost']['shipment_id'];
        }
        return $shipmentId;
    }

    protected function getApiKey()
    {
        if (!$this->checkLiving()) return null;
        return $this->token;
    }

    public function canCreateTransaction(Shipment $shipment): bool
    {
        $order = $shipment->order;
        if (
            $order && $order->id && $order->shipping_method->getValue() == SHIPVIETTELPOST_SHIPPING_METHOD_NAME
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
        switch ($status) {
            case 502:
            case 504:
            case 101:
            case 106:
            case 107:
            case 505:
            case 506:
            case 507:
            case 503:
                return ShippingStatusEnum::CANCELED;
            case 102:
                // return ShippingStatusEnum::DON_HANG_CHO_XU_LY;
                break;
            case 103:
                // return ShippingStatusEnum::GIAO_CHO_BUU_CUC;
                break;
            case 104:
                // return ShippingStatusEnum::GIAO_CHO_BUU_TA_DI_NHAN;
                break;
            case 105:
                // return ShippingStatusEnum::BUU_TA_DA_NHAN_HANG;
                break;
            case 200:
                // return ShippingStatusEnum::NHAN_TU_BUU_TA_BUU_CUC_GOC;
                break;
            case 201:
                // return ShippingStatusEnum::HUY_NHAP_PHIEU_GUI;
                break;
            case 202:
                // return ShippingStatusEnum::SUA_PHIEU_GUI;
                break;
            case 300:
                // return ShippingStatusEnum::DONG_BANG_KE_DI;
                break;
            case 301:
                // return ShippingStatusEnum::ÐONG_TUI_GOI;
                break;
            case 302:
                // return ShippingStatusEnum::DONG_CHUYEN_THU;
                break;
            case 303:
                // return ShippingStatusEnum::DONG_TUYEN_XE;
                break;
            case 400:
                // return ShippingStatusEnum::NHAN_BANG_KE_DEN;
                break;
            case 401:
                // return ShippingStatusEnum::NHAN_TUI_GOI;
                break;
            case 402:
                // return ShippingStatusEnum::NHAN_CHUYEN_THU;
                break;
            case 403:
                // return ShippingStatusEnum::NHAN_CHUYEN_XE;
                break;
            case 550:
            case 508:
            case 509:
            case 510:
            case 515:
            case 500:
                return ShippingStatusEnum::DELIVERING;
            case 501:
                return ShippingStatusEnum::DELIVERED;
            default:
                return null;
        }
    }
    public function printOrder($order_no)
    {
        return $this->callRequest($this->host . '/order/printing-code', [
            CURLOPT_POSTFIELDS => json_encode([
                'EXPIRY_TIME' => 0,
                'ORDER_ARRAY' => [
                    $order_no
                ]
            ])
        ]);
    }
}
