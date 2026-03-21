<?php

Route::group(['namespace' => 'Botble\OnePay\Http\Controllers', 'middleware' => ['web', 'core']], function () {
    Route::get('payment/onepay/status', 'OnePayController@getCallback')->name('payments.onepay.status');
});
