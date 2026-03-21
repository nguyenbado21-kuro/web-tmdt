
@if (get_payment_setting('status', ONEPAY_PAYMENT_METHOD_NAME) == 1)
    <!-- <li class="list-group-item">
        <input class="magic-radio js_payment_method" type="radio" name="payment_method" id="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}"
            value="{{ ONEPAY_PAYMENT_METHOD_NAME }}" data-bs-toggle="collapse" data-bs-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_wrap"
            data-toggle="collapse" data-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_wrap"
            data-parent=".list_payment_method"
            @if ($selecting == ONEPAY_PAYMENT_METHOD_NAME) checked @endif>
        <label for="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}">{{ get_payment_setting('name', ONEPAY_PAYMENT_METHOD_NAME) }}</label>
        <div class="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}_wrap payment_collapse_wrap collapse @if ($selecting == ONEPAY_PAYMENT_METHOD_NAME) show @endif">
            <p>{!! get_payment_setting('description', ONEPAY_PAYMENT_METHOD_NAME, __('Payment with ONEPAY')) !!}</p>
        </div>
    </li> -->
    <li class="list-group-item">
        <input class="js_payment_method" type="radio" name="payment_method"
            id="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}INTERNATIONAL" value="onepay_INTERNATIONAL"
            data-bs-toggle="collapse" data-bs-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}INTERNATIONAL_wrap"
            data-toggle="collapse" data-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}INTERNATIONAL_wrap"
            data-parent=".list_payment_method" @if ($selecting == 'onepay_INTERNATIONAL') checked @endif>
        <label for="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}INTERNATIONAL">Thẻ tín dụng / Ghi nợ
            <img class="" src="{{ url('vendor/core/plugins/onepay/images/visa.png') }}" alt="visa" style="max-width: 125px">
        </label>
        <!-- <div class="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}INTERNATIONAL_wrap payment_collapse_wrap collapse @if ($selecting == 'onepay_INTERNATIONAL') show @endif">
            <p>{!! get_payment_setting('description', ONEPAY_PAYMENT_METHOD_NAME, __('Payment with ONEPAY')) !!}</p>
        </div> -->
    </li>
    <li class="list-group-item">
        <input class="js_payment_method" type="radio" name="payment_method"
            id="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}DOMESTIC" value="onepay_DOMESTIC" data-bs-toggle="collapse"
            data-bs-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}DOMESTIC_wrap" data-toggle="collapse"
            data-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}DOMESTIC_wrap" data-parent=".list_payment_method"
            @if ($selecting == 'onepay_DOMESTIC') checked @endif>
        <label for="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}DOMESTIC">Thẻ ATM / Tài khoản ngân hàng</label>
        <!-- <div class="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}DOMESTIC_wrap payment_collapse_wrap collapse @if ($selecting == 'onepay_DOMESTIC') show @endif">
            <p>{!! get_payment_setting('description', ONEPAY_PAYMENT_METHOD_NAME, __('Payment with ONEPAY')) !!}</p>
        </div> -->
    </li>
    <li class="list-group-item">
        <input class="js_payment_method" type="radio" name="payment_method"
            id="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}QR" value="onepay_QR" data-bs-toggle="collapse"
            data-bs-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}QR_wrap" data-toggle="collapse"
            data-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}QR_wrap" data-parent=".list_payment_method"
            @if ($selecting == 'onepay_QR') checked @endif>
        <label for="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}QR">Thanh toán mã QR với Ứng dụng di động
            <img style="height: 20px; width:20px" src="{{ url('vendor/core/plugins/onepay/images/qr.png') }}" alt="qr">
        </label>
        <!-- <div class="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}QR_wrap payment_collapse_wrap collapse @if ($selecting == 'onepay_QR') show @endif">
            <p>{!! get_payment_setting('description', ONEPAY_PAYMENT_METHOD_NAME, __('Payment with ONEPAY')) !!}</p>
        </div> -->
    </li>
    <li class="list-group-item">
        @if(Cart::instance('cart')->rawTotal() > 3000000)
            <input class="js_payment_method" type="radio" name="payment_method"
                   id="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}TG" value="onepay_TG" data-bs-toggle="collapse"
                   data-bs-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}TG_wrap" data-toggle="collapse"
                   data-target=".payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}TG_wrap" data-parent=".list_payment_method"
                   @if ($selecting == 'onepay_TG') checked @endif>
        @else
            <input type="radio" disabled>
        @endif
        <label for="payment_{{ ONEPAY_PAYMENT_METHOD_NAME }}TG">Thanh toán trả góp</label>
    </li>
@endif
