<?php

use Botble\ShipViettelPost\ShipViettelPost;
use Botble\ShipViettelPost\ViettelPost;

Route::group(['namespace' => 'Botble\ShipViettelPost\Http\Controllers', 'middleware' => ['web', 'core']], function () {
    Route::group(['prefix' => BaseHelper::getAdminPrefix(), 'middleware' => 'auth'], function () {
        Route::group([
            'prefix' => 'shipments/shipviettelpost',
            'as' => 'ecommerce.shipments.shipviettelpost.',
            'permission' => 'ecommerce.shipments.index',
        ], function () {
            Route::controller('ShipViettelPostController')->group(function () {
                Route::get('show/{id}', [
                    'as' => 'show',
                    'uses' => 'show',
                ]);

                Route::post('transactions/create/{id}', [
                    'as' => 'transactions.create',
                    'uses' => 'createTransaction',
                    'permission' => 'ecommerce.shipments.edit',
                ]);

                Route::get('rates/{id}', [
                    'as' => 'rates',
                    'uses' => 'getRates',
                ]);

                Route::post('update-rate/{id}', [
                    'as' => 'update-rate',
                    'uses' => 'updateRate',
                    'permission' => 'ecommerce.shipments.edit',
                ]);
            });

            Route::group(['prefix' => 'settings', 'as' => 'settings.'], function () {
                Route::post('update', [
                    'as' => 'update',
                    'uses' => 'ShipViettelPostSettingController@update',
                    'middleware' => 'preventDemo',
                    'permission' => 'shipping_methods.index',
                ]);
            });
        });
    });

    // if (is_plugin_active('marketplace')) {
    //     Route::group(apply_filters(BASE_FILTER_GROUP_PUBLIC_ROUTE, []), function () {
    //         Route::group([
    //             'prefix' => 'vendor',
    //             'as' => 'marketplace.vendor.',
    //             'middleware' => ['vendor'],
    //         ], function () {
    //             Route::group(['prefix' => 'orders', 'as' => 'orders.'], function () {
    //                 Route::group(['prefix' => 'shippo', 'as' => 'shippo.'], function () {
    //                     Route::controller('ShippoController')->group(function () {
    //                         Route::get('show/{id}', [
    //                             'as' => 'show',
    //                             'uses' => 'show',
    //                         ]);

    //                         Route::post('transactions/create/{id}', [
    //                             'as' => 'transactions.create',
    //                             'uses' => 'createTransaction',
    //                         ]);

    //                         Route::get('rates/{id}', [
    //                             'as' => 'rates',
    //                             'uses' => 'getRates',
    //                         ]);

    //                         Route::post('update-rate/{id}', [
    //                             'as' => 'update-rate',
    //                             'uses' => 'updateRate',
    //                         ]);
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // }
});

Route::group([
    'namespace' => 'Botble\ShipViettelPost\Http\Controllers',
    'prefix' => 'shipviettelpost',
    // 'middleware' => ['api', 'shipghn.webhook'],
    'as' => 'shipviettelpost.',
], function () {
    Route::controller('ShipViettelPostWebhookController')->group(function () {
        Route::post('webhook', [
            'uses' => 'index',
            'as' => 'updateShipment',
        ]);
    });
    Route::get('test-viettelpost', function () {
        return app(ViettelPost::class)->getListKhoHang();
    });
});
