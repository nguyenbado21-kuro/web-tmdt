@if (app(Botble\ShipViettelPost\ShipViettelPost::class)->canCreateTransaction($shipment))
    @php
        $url = route('ecommerce.shipments.shipviettelpost.show', $shipment->id);
        if (!is_in_admin(true) && is_plugin_active('marketplace')) {
            $url = route('marketplace.vendor.orders.shipviettelpost.show', $shipment->id);
        }
    @endphp
    <button type="button" class="btn btn-primary"
        data-bs-toggle="modal" data-bs-target="#shipviettelpost-view-n-create-transaction"
        data-url="{{ $url }}">
        <img src="{{ url('vendor/core/plugins/shippo/images/icon.svg') }}" alt="shipviettelpost" height="16">
        <span>{{ trans('plugins/shipviettelpost::shipviettelpost.transaction.view_and_create') }}</span>
    </button>

    <div class="modal fade" id="shipviettelpost-view-n-create-transaction" tabindex="-1" aria-labelledby="shipviettelpost-view-n-create-transaction-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="shipviettelpost-view-n-create-transaction-label">{{ trans('plugins/shipviettelpost::shipviettelpost.transaction.view_and_create') }}</h5>
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
        <span>{{ trans('plugins/shipviettelpost::shipviettelpost.print_label') }}</span>
    </a>
@endif
