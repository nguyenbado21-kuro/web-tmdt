@php $onepayStatus = get_payment_setting('status', ONEPAY_PAYMENT_METHOD_NAME); @endphp
<table class="table payment-method-item">
    <tbody>
        <tr class="border-pay-row">
            <td class="border-pay-col"><i class="fa fa-theme-payments"></i></td>
            <td style="width: 20%;">
                <img class="filter-black" src="{{ url('vendor/core/plugins/onepay/images/onepay.svg') }}" alt="onepay">
            </td>
            <td class="border-right">
                <ul>
                    <li>
                        <a href="https://onepay.vn" target="_blank">OnePay</a>
                        <p>{{ __('Customer can buy product and pay directly using Visa, Credit card via OnePay') }}</p>
                    </li>
                </ul>
            </td>
        </tr>
        <tr class="bg-white">
            <td colspan="3">
                <div class="float-start" style="margin-top: 5px;">
                    <div class="payment-name-label-group @if (get_payment_setting('status', ONEPAY_PAYMENT_METHOD_NAME) == 0) hidden @endif">
                        <span class="payment-note v-a-t">{{ trans('plugins/payment::payment.use') }}:</span> <label
                            class="ws-nm inline-display method-name-label">{{ get_payment_setting('name', ONEPAY_PAYMENT_METHOD_NAME) }}</label>
                    </div>
                </div>
                <div class="float-end">
                    <a
                        class="btn btn-secondary toggle-payment-item edit-payment-item-btn-trigger @if ($onepayStatus == 0) hidden @endif">{{ trans('plugins/payment::payment.edit') }}</a>
                    <a
                        class="btn btn-secondary toggle-payment-item save-payment-item-btn-trigger @if ($onepayStatus == 1) hidden @endif">{{ trans('plugins/payment::payment.settings') }}</a>
                </div>
            </td>
        </tr>
        <tr class="paypal-online-payment payment-content-item hidden">
            <td class="border-left" colspan="3">
                {!! Form::open() !!}
                {!! Form::hidden('type', ONEPAY_PAYMENT_METHOD_NAME, ['class' => 'payment_type']) !!}
                <div class="row">
                    <div class="col-sm-6">
                        <ul>
                            <li>
                                <label>{{ trans('plugins/payment::payment.configuration_instruction', ['name' => 'OnePay']) }}</label>
                            </li>
                            <li class="payment-note">
                                <p>{{ trans('plugins/payment::payment.configuration_requirement', ['name' => 'OnePay']) }}
                                    :</p>
                                <ul class="m-md-l" style="list-style-type:decimal">
                                    <li style="list-style-type:decimal">
                                        <a href="https://onepay.vn" target="_blank">
                                            {{ __('Register an account on OnePay') }}
                                        </a>
                                    </li>
                                    <li style="list-style-type:decimal">
                                        <p>{{ __('After registration at :name, you will have Client ID, Client Secret', ['name' => 'OnePay']) }}
                                        </p>
                                    </li>
                                    <li style="list-style-type:decimal">
                                        <p>{{ __('Enter Client ID, Secret into the box in right hand') }}</p>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div class="col-sm-6">
                        <div class="well bg-white">
                            <div class="form-group mb-3">
                                <label class="text-title-field"
                                    for="onepay_name">{{ trans('plugins/payment::payment.method_name') }}</label>
                                <input type="text" class="next-input"
                                    name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_name" id="onepay_name"
                                    data-counter="400"
                                    value="{{ get_payment_setting('name', ONEPAY_PAYMENT_METHOD_NAME, __('Online payment via :name', ['name' => 'OnePay'])) }}">
                            </div>
                            <div class="form-group mb-3">
                                <label class="text-title-field"
                                    for="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_description">{{ trans('core/base::forms.description') }}</label>
                                <textarea class="next-input" name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_description"
                                    id="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_description">{{ get_payment_setting('description', ONEPAY_PAYMENT_METHOD_NAME, __('Payment with OnePay')) }}</textarea>
                            </div>

                            <p class="payment-note">
                                {{ trans('plugins/payment::payment.please_provide_information') }} <a target="_blank"
                                    href="https://onepay.vn/">OnePay</a>:
                            </p>
                            <div class="form-group mb-3">
                                <label class="text-title-field" for="onepay_host">Host</label>
                                <input type="text" class="next-input" id="onepay_host"
                                    name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_host"
                                    value="{{ get_payment_setting('host', ONEPAY_PAYMENT_METHOD_NAME) }}">
                            </div>

                            <div class="form-group mb-3">
                                <label class="text-title-field" for="onepay_merchant_tg">Merchant_TG</label>
                                <input type="text" class="next-input"
                                    name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_merchant_tg" id="onepay_merchant_tg"
                                    value="{{ get_payment_setting('merchant_tg', ONEPAY_PAYMENT_METHOD_NAME) }}"
                                    placeholder="">
                            </div>
                            <div class="form-group mb-3">
                                <label class="text-title-field" for="onepay_accessCode_tg">AccessCode_TG</label>
                                <input type="password" class="next-input" placeholder="••••••••"
                                    id="onepay_accessCode_tg"
                                    name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_accessCode_tg"
                                    value="{{ get_payment_setting('accessCode_tg', ONEPAY_PAYMENT_METHOD_NAME) }}">
                            </div>
                            <div class="form-group mb-3">
                                <label class="text-title-field" for="onepay_secureSecret_tg">Secure Secret_TG</label>
                                <input type="text" class="next-input" id="onepay_secureSecret_tg"
                                    name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_secureSecret_tg"
                                    value="{{ get_payment_setting('secureSecret_tg', ONEPAY_PAYMENT_METHOD_NAME) }}">
                            </div>
                            <div class="form-group mb-3">
                                <label class="text-title-field" for="onepay_merchant">Merchant</label>
                                <input type="text" class="next-input"
                                    name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_merchant" id="onepay_merchant"
                                    value="{{ get_payment_setting('merchant', ONEPAY_PAYMENT_METHOD_NAME) }}"
                                    placeholder="rzp_***">
                            </div>
                            <div class="form-group mb-3">
                                <label class="text-title-field" for="onepay_accessCode">AccessCode</label>
                                <input type="password" class="next-input" placeholder="••••••••"
                                    id="onepay_accessCode" name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_accessCode"
                                    value="{{ get_payment_setting('accessCode', ONEPAY_PAYMENT_METHOD_NAME) }}">
                            </div>
                            <div class="form-group mb-3">
                                <label class="text-title-field" for="onepay_secureSecret">Secure Secret</label>
                                <input type="text" class="next-input" id="onepay_secureSecret"
                                    name="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_secureSecret"
                                    value="{{ get_payment_setting('secureSecret', ONEPAY_PAYMENT_METHOD_NAME) }}">
                            </div>
                            {!! apply_filters(PAYMENT_METHOD_SETTINGS_CONTENT, null, ONEPAY_PAYMENT_METHOD_NAME) !!}
                        </div>
                    </div>
                </div>
                <div class="col-12 bg-white text-end">
                    <button
                        class="btn btn-warning disable-payment-item @if ($onepayStatus == 0) hidden @endif"
                        type="button">{{ trans('plugins/payment::payment.deactivate') }}</button>
                    <button
                        class="btn btn-info save-payment-item btn-text-trigger-save @if ($onepayStatus == 1) hidden @endif"
                        type="button">{{ trans('plugins/payment::payment.activate') }}</button>
                    <button
                        class="btn btn-info save-payment-item btn-text-trigger-update @if ($onepayStatus == 0) hidden @endif"
                        type="button">{{ trans('plugins/payment::payment.update') }}</button>
                </div>
                {!! Form::close() !!}
            </td>
        </tr>
    </tbody>
</table>
