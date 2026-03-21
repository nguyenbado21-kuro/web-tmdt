<?php

namespace Botble\Shipghtk\Providers;

use Botble\ShipGhtk\Commands\InitShipghtkCommand;
use Illuminate\Support\ServiceProvider;

class CommandServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->commands([
            InitShipghtkCommand::class,
        ]);
    }
}
