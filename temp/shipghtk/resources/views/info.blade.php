@php
    $parcel = Arr::get($shipmentShipghtk, 'parcels.0');
    $distanceUnit = Arr::get($parcel, 'distance_unit');
    $massUnit = Arr::get($parcel, 'mass_unit');

    $url = route('ecommerce.shipments.shipghtk.transactions.create', $shipment->id);
    $isShowButton = true;
    if (!is_in_admin(true)) {
        if (is_plugin_active('marketplace')) {
            $url = route('marketplace.vendor.orders.shipghtk.transactions.create', $shipment->id);
        }
    } elseif (Auth::check() && !Auth::user()->hasPermission('ecommerce.shipments.edit')) {
        $isShowButton = false;
    }
    $rateCreated = Carbon\Carbon::create(Arr::get($rate, 'object_created'));

    $days = Arr::get($rate, 'days', Arr::get($rate, 'estimated_days', 0));
    
@endphp
<div class="container">
    <div class="row">
        <div class="col-12 my-3 text-center">
            <div>
                @if ($image = Arr::get($rate, 'provider_image_75'))
                    <img src="{{ $image }}" alt="{{ Arr::get($rate, 'servicelevel.name') }}" style="max-height: 40px; max-width: 55px">
                @endif
                <span>
                    {{ Arr::get($rate, 'servicelevel.name') }}
                </span>
                <!-- @php
                    $days = Arr::get($rate, 'days', Arr::get($rate, 'estimated_days', 0));
                @endphp -->
                <div>
                    <small class="text-secondary">{{ trans('plugins/shipghtk::shipghtk.estimated_days', ['day' => $days]) }}</small>
                </div>
            </div>
        </div>
        <div class="col-12 my-2">
            @include('plugins/shipghtk::address')
        </div>

        <div class="col-12 my-2">
            @includeif('plugins/shipghtk::shipping-fee')
        </div>
        <div class="col-12 mt-2">
            <span class="fw-bold" style="font-size: 18px">{{ trans('plugins/shipghtk::shipghtk.parcel') }}</span>
            
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">{{ trans('plugins/ecommerce::products.form.shipping.weight') }}</th>
                        <th scope="col">{{ trans('plugins/ecommerce::products.form.shipping.length') }}</th>
                        <th scope="col">{{ trans('plugins/ecommerce::products.form.shipping.wide') }}</th>
                        <th scope="col">{{ trans('plugins/ecommerce::products.form.shipping.height') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ number_format(Arr::get($parcel, 'weight'), 2) . ' ' . $massUnit }}</td>
                        <td>{{ number_format(Arr::get($parcel, 'length'), 2) . ' ' . $distanceUnit }}</td>
                        <td>{{ number_format(Arr::get($parcel, 'width'), 2) . ' ' . $distanceUnit}}</td>
                        <td>{{ number_format(Arr::get($parcel, 'height'), 2) . ' ' . $distanceUnit}}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- @php
            $url = route('ecommerce.shipments.shipghtk.transactions.create', $shipment->id);
            $isShowButton = true;
            if (!is_in_admin(true)) {
                if (is_plugin_active('marketplace')) {
                    $url = route('marketplace.vendor.orders.shipghtk.transactions.create', $shipment->id);
                }
            } elseif (Auth::check() && !Auth::user()->hasPermission('ecommerce.shipments.edit')) {
                $isShowButton = false;
            }
        @endphp -->


        @if ($isShowButton)
            <div class="col-12 my-3">
                <button type="button" class="btn btn-primary create-transaction" data-url="{{ $url }}">
                    {{ Botble\Ecommerce\Enums\ShippingStatusEnum::READY_TO_BE_SHIPPED_OUT()->label() }}
                </button>
            </div>

            @if (now()->subHours(24)->gt($rateCreated))
                <div class="col-12 my-3">
                    <div class="alert alert-warning">
                    <small>
                        <i class="fa fa-info-circle"></i>
                        <span>{{ trans('plugins/shipghtk::shipghtk.note_5') }}</span>
                    </small>
                    </div>
                    <button type="button" class="btn btn-primary get-new-rates" data-url="{{ route('ecommerce.shipments.shipghtk.rates', $shipment->id) }}">
                        {{ trans('plugins/shipghtk::shipghtk.recheck_rate') }}
                    </button>
                </div>
            @endif
        @endif
    </div>
</div>
