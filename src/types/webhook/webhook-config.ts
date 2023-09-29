export interface CreateWebhookConfigResponse {
    code?: number;
    data?: {
        default_url: string | null;
        expires_at: number | null;
        events: {
            type: string;
            url: string;
            params?: {
                name: string;
                value: { id: number }[];
            }[];
        }[];
        public_key: string;
        secret_key: string;
    };
    error?: {
        reason: string;
        message: string;
    };
}

export interface CreateWebhookConfigRequest {
    default_url: string;
    expires_at?: number | null;
    store_id?: string;
    events?: {
        enabled?: boolean;
        type: string;
        url: string;
        params?: {
            name: string;
            value: { id: number }[];
        }[];
    }[];
    public_key: string;
}

export interface CreateWebhookEventRequest {
    type: string;
    url: string;
    params?: {
        name: string;
        value: { id: number }[];
    }[];
}

export interface WebhookEventResponse {
    code?: number;
    data?: {
        type: string;
        url: string | null;
        params?: {
            name: string;
            value: { id: number }[];
        }[];
    };
    error?: {
        reason: string;
        message: string;
    };
}

export interface GetEventConfigRequest {
    eventType: string;
    show_expired?: boolean;
    store_id: string;
}

export interface GetEventConfigResponse {
    code: number;
    data?: {
        type: string;
        url: string | null;
        params?: {
            name: string;
            value: any[]; // Replace 'any' with the actual type of product data if available
        }[];
    };
    error?: {
        reason: string;
        message: string;
    };
}

export interface GetWebhookConfigRequest {
    show_expired?: boolean;
    store_id?: string;
}

export interface EventConfiguration {
    type: string;
    url: string | null;
    params?: {
        name: string;
        value: any[]; // Replace 'any' with the actual type if available
    }[];
}

export interface GetWebhookConfigResponse {
    code?: number;
    result?: GetWebhookConfigResponseResult;
    error?: {
        reason: string;
        message: string;
    };
}

export interface GetWebhookConfigResponseResult {
    default_url: string | null;
    expires_at: number | null;
    events: EventConfiguration[];
    public_key: string;
}

export interface SetWebhookEventRequestParam {
    name: string;
    value: { id: number }[];
}

type WebhookEventType =
    | "shipment_sent"
    | "shipment_returned"
    | "order_created"
    | "order_updated"
    | "order_failed"
    | "order_canceled"
    | "product_synced"
    | "product_updated"
    | "product_deleted"
    | "catalog_stock_updated"
    | "catalog_price_changed"
    | "order_put_hold"
    | "order_put_hold_approval"
    | "order_remove_hold";

export interface SetWebhookEventRequest {
    type: WebhookEventType;
    url: string;
    enabled?: boolean;
    params?: SetWebhookEventRequestParam[];
}


export interface SetWebhookEventResponse {
    code?: number;
    result?: {
        type: string;
        url: string;
        params?: SetWebhookEventRequestParam[];
    };
    error?: {
        reason: string;
        message: string;
    };
}

