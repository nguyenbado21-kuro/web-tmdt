@php
    $status = setting('shipping_shipviettelpost_status', 0);
    $hostKey = setting('shipping_shipviettelpost_host_key') ?: '';
    $userName = setting('shipping_shipviettelpost_user_name') ?: '';
    $password = setting('shipping_shipviettelpost_password') ?: '';
    $token = setting('shipping_shipviettelpost_token') ?: '';
    $test = setting('shipping_shipviettelpost_sandbox', 1) ?: 0;
    $logging = setting('shipping_shipviettelpost_logging', 1) ?: 0;
    $webhook = setting('shipping_shipviettelpost_webhooks', 1) ?: 0;
@endphp
<table class="table mt-4 bg-white">
    <tbody>
        <tr class="border-pay-row">
            <td class="border-pay-col">
                <i class="fas fa-shipping-fast"></i>
            </td>
            <td style="width: 20%;">
                <img class="filter-black" src="{{ url('vendor/core/plugins/shipviettelpost/images/logo-dark.svg') }}" alt="shipviettelpost">
            </td>
            <td class="border-right">
                <ul>
                    <li>
                        <a href="https://goshippo.com/" target="_blank">VIETTELPOST</a>
                        <p>{{ trans('plugins/shipviettelpost::shipviettelpost.description') }}</p>
                    </li>
                </ul>
            </td>
        </tr>
        <tr class="bg-white">
            <td colspan="3">
                <div class="float-start" style="margin-top: 5px;">
                    <div class="payment-name-label-group  @if ($status == 0) d-none @endif">
                        <span class="payment-note v-a-t">{{ trans('plugins/payment::payment.use') }}:</span>
                        <label class="ws-nm inline-display method-name-label">ViettelPost</label>
                    </div>
                </div>
                <div class="float-end">
                    <a class="btn btn-secondary" data-bs-toggle="collapse"
                        href="#collapse-shipping-method-shipviettelpost" role="button" aria-expanded="false"
                        aria-controls="collapse-shipping-method-shipviettelpost">
                        @if ($status == 0) {{ trans('core/base::forms.edit') }} @else {{ trans('core/base::layouts.settings') }} @endif
                    </a>
                </div>
            </td>
        </tr>
        <tr class="collapse" id="collapse-shipping-method-shipviettelpost">
            <td class="border-left" colspan="3">
                {!! Form::open(['route' => 'ecommerce.shipments.shipviettelpost.settings.update']) !!}
                    <div class="row">
                        <div class="col-sm-6">
                            <ul>

                                <li>
                                    <div class="alert alert-warning">
                                        <h5 class="text-danger">{{ trans('plugins/shipviettelpost::shipviettelpost.note_0') }}</h5>
                                        <ul class="ps-3">
                                            <li style="list-style-type: circle;">
                                                <span>{!! BaseHelper::clean(trans('plugins/shipviettelpost::shipviettelpost.note_1', ['link' => 'https://docs.botble.com/farmart/1.x/usage-location'])) !!}</span>
                                            </li>
                                            <li style="list-style-type: circle;">
                                                <span>{{ trans('plugins/shipviettelpost::shipviettelpost.note_2') }}</span>
                                            </li>
                                            <li style="list-style-type: circle;">
                                                <span>{!! BaseHelper::clean(trans('plugins/shipviettelpost::shipviettelpost.note_3', ['link' => route('ecommerce.settings')])) !!}</span>
                                            </li>
                                            <li style="list-style-type: circle;">
                                                <span>{!! BaseHelper::clean(trans('plugins/shipviettelpost::shipviettelpost.note_6', ['link' => 'https://goshippo.com/docs/reference#parcels-extras'])) !!}</span>
                                            </li>
                                            @if (is_plugin_active('marketplace'))
                                                <li style="list-style-type: circle;">
                                                    <span>{{ trans('plugins/shipviettelpost::shipviettelpost.note_4') }}</span>
                                                </li>
                                            @endif
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <label>{{ trans('plugins/shipviettelpost::shipviettelpost.configuration_instruction', ['name' => 'ShipViettelPost']) }}</label>
                                </li>
                                <li class="text-secondary">
                                    <p>{{ trans('plugins/shipviettelpost::shipviettelpost.configuration_requirement', ['name' => 'ShipViettelPost']) }}:</p>
                                    <ul class="ms-3 ps-2">
                                        <li style="list-style-type: decimal">
                                            <p>
                                                <a href="https://apps.goshippo.com/join" target="_blank">
                                                    {{ trans('plugins/shipviettelpost::shipviettelpost.service_registration', ['name' => 'ShipViettelPost']) }}
                                                </a>
                                            </p>
                                        </li>
                                        <li style="list-style-type: decimal">
                                            <p>{{ trans('plugins/shipviettelpost::shipviettelpost.after_service_registration_msg', ['name' => 'ShipViettelPost']) }}</p>
                                        </li>
                                        <li style="list-style-type: decimal">
                                            <p>{{ trans('plugins/shipviettelpost::shipviettelpost.enter_api_key') }}</p>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div class="col-sm-6">
                            <div class="well">
                                <p class="text-secondary">
                                    {{ trans('plugins/shipviettelpost::shipviettelpost.please_provide_information') }}
                                    <a target="_blank" href="https://goshippo.com/">ShipViettelPost</a>:
                                </p>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_host_key">Host</label>
                                    <input type="text" class="form-control" placeholder="<HOST-KEY>" id="shipping_shipviettelpost_host_key"
                                        name="shipping_shipviettelpost_host_key"
                                        @env('demo') disabled value="{{ Str::mask($hostKey, '*', 10) }}" @else value="{{ $hostKey }}" @endenv>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_user_name">User Name</label>
                                    <div class="input-option">
                                        <input type="text" class="form-control" placeholder="<USER-NAME>" id="shipping_shipviettelpost_user_name"
                                            name="shipping_shipviettelpost_user_name"
                                            @env('demo') disabled value="{{ Str::mask($userName, '*', 10) }}" @else value="{{ $userName }}" @endenv>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_password">Password</label>
                                    <div class="input-option">
                                        <input type="text" class="form-control" placeholder="<PASSWORD>" id="shipping_shipviettelpost_password"
                                            name="shipping_shipviettelpost_password"
                                            @env('demo') disabled value="{{ Str::mask($password, '*', 10) }}" @else value="{{ $password }}" @endenv>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_token">Token</label>
                                    <div class="input-option">
                                        <input type="text" class="form-control" placeholder="<TOKEN>" id="shipping_shipviettelpost_token"
                                            name="shipping_shipviettelpost_token"
                                            @env('demo') disabled value="{{ Str::mask($token, '*', 10) }}" @else value="{{ $token }}" @endenv>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_sandbox">
                                        {!! Form::onOff('shipping_shipviettelpost_sandbox', $test) !!}
                                        {{ trans('plugins/shipviettelpost::shipviettelpost.sandbox_mode') }}
                                    </label>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_status">
                                        {!! Form::onOff('shipping_shipviettelpost_status', $status) !!}
                                        {{ trans('plugins/shipviettelpost::shipviettelpost.activate') }}
                                    </label>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_logging">
                                        {!! Form::onOff('shipping_shipviettelpost_logging', $logging) !!}
                                        {{ trans('plugins/shipviettelpost::shipviettelpost.logging') }}
                                    </label>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_webhooks">
                                        {!! Form::onOff('shipping_shipviettelpost_webhooks', $webhook) !!}
                                        {{ trans('plugins/shipviettelpost::shipviettelpost.webhooks') }}
                                    </label>
                                    <div class="help-block">
                                        <a href="#" class="text-warning fw-bold">
                                            <span>Webhooks</span>
                                            <i class="fas fa-external-link-alt"></i>
                                        </a>
                                        <div>URL: <i>{{ route('shipviettelpost.updateShipment', ['_token' => '__API_TOKEN__']) }}</i></div>
                                    </div>
                                </div>
                                <!-- <div class="form-group mb-3">
                                    <label class="control-label" for="shipping_shipviettelpost_validate">
                                        {!! Form::checkbox('shipping_shipviettelpost_validate', 1) !!}
                                        {{ trans('plugins/shipviettelpost::shipviettelpost.check_validate_token') }}
                                    </label>
                                </div> -->
                            </div>
                            @env('demo')
                                <div class="col-12">
                                    <div class="alert alert-warning">
                                        <strong>{{ trans('plugins/shipviettelpost::shipviettelpost.disabled_in_demo_mode') }}</strong>
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
