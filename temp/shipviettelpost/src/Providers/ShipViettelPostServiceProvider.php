<?php

namespace Botble\ShipViettelPost\Providers;

use Botble\Base\Traits\LoadAndPublishDataTrait;
use Botble\ShipViettelPost\Http\Middleware\WebhookMiddleware;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class ShipViettelPostServiceProvider extends ServiceProvider
{
    use LoadAndPublishDataTrait;

    public function register(): void
    {
        if (! is_plugin_active('ecommerce')) {
            return;
        }

        $this->setNamespace('plugins/shipviettelpost')->loadHelpers();
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

        $router->aliasMiddleware('shipviettelpost.webhook', WebhookMiddleware::class);

        $config = $this->app['config'];
        if (! $config->has('logging.channels.shipviettelpost')) {
            $config->set([
                'logging.channels.shipviettelpost' => [
                    'driver' => 'daily',
                    'path' => storage_path('logs/shipviettelpost.log'),
                ],
            ]);
        }

        $this->app->register(HookServiceProvider::class);
        $this->app->register(CommandServiceProvider::class);
    }
}
