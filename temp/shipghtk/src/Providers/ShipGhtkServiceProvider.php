<?php

namespace Botble\ShipGhtk\Providers;

use Botble\Base\Traits\LoadAndPublishDataTrait;
use Botble\ShipGhtk\Http\Middleware\WebhookMiddleware;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class ShipGhtkServiceProvider extends ServiceProvider
{
    use LoadAndPublishDataTrait;

    public function register(): void
    {
        if (! is_plugin_active('ecommerce')) {
            return;
        }

        $this->setNamespace('plugins/shipghtk')->loadHelpers();
    }

    public function boot(): void
    {
        if (! is_plugin_active('ecommerce')) {
            return;
        }

        $this
            ->loadAndPublishTranslations()
            ->loadAndPublishViews()
            ->loadRoutes()
            ->loadAndPublishConfigurations(['general'])
            ->publishAssets();

        /**
         * @var Router $router
         */
        $router = $this->app['router'];

        $router->aliasMiddleware('shipghtk.webhook', WebhookMiddleware::class);

        $config = $this->app['config'];
        if (! $config->has('logging.channels.shipghtk')) {
            $config->set([
                'logging.channels.shipghtk' => [
                    'driver' => 'daily',
                    'path' => storage_path('logs/shipghtk.log'),
                ],
            ]);
        }

        $this->app->register(HookServiceProvider::class);
        $this->app->register(CommandServiceProvider::class);
    }
}
