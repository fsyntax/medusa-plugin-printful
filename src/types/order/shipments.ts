export interface Shipment {
    id: number;
    order_id: number;
    order_external_id: string;
    carrier: string;
    service: string;
    shipment_status: string;
    shipped_at?: string;
    delivery_status?: string;
    delivered_at?: string;
    departure_address: {
        country_name: string;
        country_code: string;
        state_code: string;
    };
    is_reshipment: boolean;
    tracking_url: string;
    tracking_events: {
        triggered_at: string;
        description: string;
    }[];
    estimated_delivery: {
        from_date: string;
        to_date: string;
        calculated_at: string;
    };
    shipment_items: {
        id: number;
        order_item_id: number;
        order_item_external_id: string;
        order_item_name: string;
        quantity: number;
        _links: {
            order_item: {
                href: string;
            };
        };
    }[];
    _links: {
        self: {
            href: string;
        };
        order: {
            href: string;
        };
    };
}

export interface GetShipmentsResponse {
    data: Shipment[];
    _links: {
        self: {
            href: string;
        };
        next: {
            href: string;
        };
        previous: {
            href: string;
        };
        first: {
            href: string;
        };
        last: {
            href: string;
        };
    };
    paging: {
        total: number;
        offset: number;
        limit: number;
    };
    code?: number;
    error?: {
        reason: string,
        message: string;
    }
}

export interface GetShipmentsRequest {
    order_id: string | number;
    offset?: number;
    limit?: number;
}
