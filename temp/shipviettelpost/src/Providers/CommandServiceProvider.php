<?php

namespace Botble\ShipViettelPost\Providers;

use Botble\ShipViettelPost\Commands\InitShipViettelPostCommand;
use Illuminate\Support\ServiceProvider;

class CommandServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->commands([
            InitShipViettelPostCommand::class,
        ]);
    }
}
