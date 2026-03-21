{!! Form::open([
        'url'   => route('ecommerce.shipments.shipviettelpost.update-rate', $shipment->id),
        'class' => 'update-rate-shipment',
    ]) !!}
    <div class="payment-checkout-form mt-3">
        @if ($rate)
            <div class="list-group list_payment_method">
                @include('plugins/shipviettelpost::rate', [
                        'index'      => 'selected',
                        'item'       => $rate,
                        'attributes' => [
                            'checked' => true,
                        ],
                    ])
            </div>
        @else
            <div>
                <p>{{ trans('plugins/shipviettelpost::shipviettelpost.carrier_could_not_be_found') }}</p>
            </div>
        @endif
        <div class="accordion mt-3 @if ($rate) opacity-75 @endif" id="accordion-rates">
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-new-rates">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-new-rates"
                        aria-expanded="false" aria-controls="collapse-new-rates">
                        {{ trans('plugins/shipviettelpost::shipviettelpost.view_other_exchange_rates', ['count' => count($rates)]) }}
                    </button>
                </h2>
                <div id="collapse-new-rates" class="accordion-collapse collapse" aria-labelledby="heading-new-rates"
                    data-bs-parent="#accordion-rates">
                    <div class="accordion-body">
                        <div class="list-group list_payment_method">
                            @foreach($rates as $item)
                                @include('plugins/shipviettelpost::rate', [
                                    'index'      => $loop->index,
                                    'attributes' => [
                                        'disabled' => $rate ? 'disabled' : false
                                    ],
                                ])
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <button type="submit" class="btn btn-primary mt-2">{{ trans('plugins/shipviettelpost::shipviettelpost.update_rate') }}</button>
{!! Form::close() !!}
