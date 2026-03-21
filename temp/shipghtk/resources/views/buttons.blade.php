@if (app(Botble\ShipGhtk\ShipGhtk::class)->canCreateTransaction($shipment))
    @php
        $url = route('ecommerce.shipments.shipghtk.show', $shipment->id);
        if (!is_in_admin(true) && is_plugin_active('marketplace')) {
            $url = route('marketplace.vendor.orders.shipghtk.show', $shipment->id);
        }
    @endphp
    <button type="button" class="btn btn-primary"
        data-bs-toggle="modal" data-bs-target="#shipghtk-view-n-create-transaction"
        data-url="{{ $url }}">
        <img src="{{ url('vendor/core/plugins/shipghtk/images/icon.svg') }}" alt="shipghtk" height="16">
        <span>{{ trans('plugins/shipghtk::shipghtk.transaction.view_and_create') }}</span>
    </button>

    <div class="modal fade" id="shipghtk-view-n-create-transaction" tabindex="-1" aria-labelledby="shipghtk-view-n-create-transaction-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="shipghtk-view-n-create-transaction-label">{{ trans('plugins/shipghtk::shipghtk.transaction.view_and_create') }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body"></div>
            </div>
        </div>
    </div>
@endif

@if ($shipment->label_url)
    <a class="btn btn-success" href="{{ $shipment->label_url }}" target="_blank" rel="noopener noreferrer">
        <i class="fa fa-print"></i>
        <span>{{ trans('plugins/shipghtk::shipghtk.print_label') }}</span>
    </a>
@endif
