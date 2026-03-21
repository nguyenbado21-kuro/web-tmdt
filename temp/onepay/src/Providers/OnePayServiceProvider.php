<?php

namespace Botble\OnePay\Providers;

use Botble\Base\Traits\LoadAndPublishDataTrait;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Support\ServiceProvider;

class OnePayServiceProvider extends ServiceProvider
{
    use LoadAndPublishDataTrait;

    /**
     * @throws FileNotFoundException
     */
    public function boot(): void
    {
        if (is_plugin_active('payment')) {
            $this->setNamespace('plugins/onepay')
                ->loadHelpers()
                ->loadRoutes()
                ->loadAndPublishViews()
                ->publishAssets();

            $this->app->register(HookServiceProvider::class);
        }
    }
}
