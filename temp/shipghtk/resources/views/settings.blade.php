@php
    $status = setting('shipping_shipghtk_status', 0);
    $hostKey = setting('shipping_shipghtk_host_key') ?: '';
    $tokenKey = setting('shipping_shipghtk_token_key') ?: '';
    $hash = setting('shipping_shipghtk_hash') ?: '';
    $test = setting('shipping_shipghtk_sandbox', 1) ?: 0;
    $logging = setting('shipping_shipghtk_logging', 1) ?: 0;
    $webhook = setting('shipping_shipghtk_webhooks', 1) ?: 0;
@endphp
<table class="table mt-4 bg-white">
    <tbody>
        <tr class="border-pay-row">
            <td class="border-pay-col">
                <i class="fas fa-shipping-fast"></i>
            </td>
            <td style="width: 20%;">
                <img class="filter-black" src="{{ url('vendor/core/plugins/shipghtk/images/logo-dark.svg') }}" alt="shipghtk">
            </td>
            <td class="border-right">
                <ul>
                    <li>
                        <a href="https://goshippo.com/" target="_blank">GHTK</a>
                        <p>{{ trans('plugins/shipghtk::shipghtk.description') }}</p>
                    </li>
                </ul>
            </td>
        </tr>
        <tr class="bg-white">
            <td colspan="3">
                <div class="float-start" style="margin-top: 5px;">
                    <div class="payment-name-label-group  @if ($status == 0) d-none @endif">
                        <span class="payment-note v-a-t">{{ trans('plugins/payment::payment.use') }}:</span>
                        <label class="ws-nm inline-display method-name-label">Ghtk</label>
                    </div>
                </div>
                <div class="float-end">
                    <a class="btn btn-secondary" data-bs-toggle="collapse"
                        href="#collapse-shipping-method-shipghtk" role="button" aria-expanded="false"
                        aria-controls="collapse-shipping-method-shipghtk">
                        @if ($status == 0) {{ trans('core/base::forms.edit') }} @else {{ trans('core/base::layouts.settings') }} @endif
                    </a>
                </div>
            </td>
        </tr>
        <tr class="collapse" id="collapse-shipping-method-shipghtk">
            <td class="border-left" colspan="3">
                {!! Form::open(['route' => 'ecommerce.shipments.shipghtk.settings.update']) !!}
                    <div class="row">
                        <div class="col-sm-6">
                            <ul>

                                <li>
                                    <div class="alert alert-warning">
                                        <h5 class="text-danger">{{ trans('plugins/shipghtk::shipghtk.note_0') }}</h5>
                                        <ul class="ps-3">
                                            <li style="list-style-type: circle;">
                                                <span>{!! BaseHelper::clean(trans('plugins/shipghtk::shipghtk.note_1', ['link' => 'https://docs.botble.com/farmart/1.x/usage-location'])) !!}</span>
                                            </li>
                                            <li style="list-style-type: circle;">
                                                <span>{{ trans('plugins/shipghtk::shipghtk.note_2') }}</span>
                                            </li>
                                            <li style="list-style-type: circle;">
                                                <span>{!! BaseHelper::clean(trans('plugins/shipghtk::shipghtk.note_3', ['link' => route('ecommerce.settings')])) !!}</span>
                                            </li>
                                            <li style="list-style-type: circle;">
                                                <span>{!! BaseHelper::clean(trans('plugins/shipghtk::shipghtk.note_6', ['link' => 'https://goshippo.com/docs/reference#parcels-extras'])) !!}</span>
                                            </li>
                                            @if (is_plugin_active('marketplace'))
                                                <li style="list-style-type: circle;">
                                                    <span>{{ trans('plugins/shipghtk::shipghtk.note_4') }}</span>
                                                </li>
                                            @endif
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <label>{{ trans('plugins/shipghtk::shipghtk.configuration_instruction', ['name' => 'ShipGhtk']) }}</label>
                                </li>
                                <li class="text-secondary">
                                    <p>{{ trans('plugins/shipghtk::shipghtk.configuration_requirement', ['name' => 'ShipGhtk']) }}:</p>
                                    <ul class="ms-3 ps-2">
                                        <li style="list-style-type: decimal">
                                            <p>
                                                <a href="https://apps.goshippo.com/join" target="_blank">
                                                    {{ trans('plugins/shipghtk::shipghtk.service_registration', ['name' => 'ShipGhtk']) }}
                                                </a>
                                            </p>
                                        </li>
                                        <li style="list-style-type: decimal">
                                            <p>{{ trans('plugins/shipghtk::shipghtk.after_service_registration_msg', ['name' => 'ShipGhtk']) }}</p>
                                        </li>
                                        <li style="list-style-type: decimal">
                                            <p>{{ trans('plugins/shipghtk::shipghtk.enter_api_key') }}</p>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div class="col-sm-6">
                            <div class="well">
                                <p class="text-secondary">
                                    {{ trans('plugins/shipghtk::shipghtk.please_provide_information') }}
                                    <a target="_blank" href="https://goshippo.com/">ShipGhtk</a>:
                                </p>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_host_key">Host</label>
                                    <input type="text" class="form-control" placeholder="<HOST-KEY>" id="shipping_shipghtk_host_key"
                                        name="shipping_shipghtk_host_key"
                                        @env('demo') disabled value="{{ Str::mask($hostKey, '*', 10) }}" @else value="{{ $hostKey }}" @endenv>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_token_key">Token</label>
                                    <div class="input-option">
                                        <input type="text" class="form-control" placeholder="<TOKEN-KEY>" id="shipping_shipghtk_token_key"
                                            name="shipping_shipghtk_token_key"
                                            @env('demo') disabled value="{{ Str::mask($tokenKey, '*', 10) }}" @else value="{{ $tokenKey }}" @endenv>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_hash">Hash</label>
                                    <div class="input-option">
                                        <input type="text" class="form-control" placeholder="<HASH>" id="shipping_shipghtk_hash"
                                            name="shipping_shipghtk_hash"
                                            @env('demo') disabled value="{{ Str::mask($hash, '*', 10) }}" @else value="{{ $hash }}" @endenv>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_sandbox">
                                        {!! Form::onOff('shipping_shipghtk_sandbox', $test) !!}
                                        {{ trans('plugins/shipghtk::shipghtk.sandbox_mode') }}
                                    </label>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_status">
                                        {!! Form::onOff('shipping_shipghtk_status', $status) !!}
                                        {{ trans('plugins/shipghtk::shipghtk.activate') }}
                                    </label>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_logging">
                                        {!! Form::onOff('shipping_shipghtk_logging', $logging) !!}
                                        {{ trans('plugins/shipghtk::shipghtk.logging') }}
                                    </label>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_webhooks">
                                        {!! Form::onOff('shipping_shipghtk_webhooks', $webhook) !!}
                                        {{ trans('plugins/shipghtk::shipghtk.webhooks') }}
                                    </label>
                                    <div class="help-block">
                                        <a href="https://goshippo.com/docs/webhooks" target="_blank" rel="noopener noreferrer" class="text-warning fw-bold">
                                            <span>Webhooks</span>
                                            <i class="fas fa-external-link-alt"></i>
                                        </a>
                                        <div>URL: <i>{{ route('shipghtk.updateShipment', ['_token' => '__API_TOKEN__']) }}</i></div>
                                    </div>
                                </div>
                                <!-- <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipghtk_validate">
                                        {!! Form::checkbox('shipping_shipghtk_validate', 1) !!}
                                        {{ trans('plugins/shipghtk::shipghtk.check_validate_token') }}
                                    </label>
                                </div> -->
                            </div>
                            @env('demo')
                                <div class="col-12">
                                    <div class="alert alert-warning">
                                        <strong>{{ trans('plugins/shipghtk::shipghtk.disabled_in_demo_mode') }}</strong>
                                    </div>
                                </div>
                            @else
                                <div class="col-12 text-end">
                                    <button class="btn btn-info" type="submit">{{ trans('core/base::forms.update') }}</button>
                                </div>
                            @endif
                        </div>
                    </div>
                {!! Form::close() !!}
            </td>
        </tr>
    </tbody>
</table>
