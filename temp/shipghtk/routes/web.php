<?php

Route::group(['namespace' => 'Botble\ShipGhtk\Http\Controllers', 'middleware' => ['web', 'core']], function () {
    Route::group(['prefix' => BaseHelper::getAdminPrefix(), 'middleware' => 'auth'], function () {
        Route::group([
            'prefix' => 'shipments/shipghtk',
            'as' => 'ecommerce.shipments.shipghtk.',
            'permission' => 'ecommerce.shipments.index',
        ], function () {
            Route::controller('ShipGhtkController')->group(function () {
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
                    'uses' => 'ShipGhtkSettingController@update',
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
    'namespace' => 'Botble\ShipGhtk\Http\Controllers',
    'prefix' => 'shipghtk',
   // 'middleware' => ['api', 'shipghn.webhook'],
    'as' => 'shipghtk.',
], function () {
    Route::controller('ShipGhtkWebhookController')->group(function () {
        Route::post('webhook', [
            'uses' => 'index',
            'as' => 'updateShipment',
        ]);
    });
});
