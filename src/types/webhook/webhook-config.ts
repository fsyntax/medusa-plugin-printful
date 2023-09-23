export interface CreateWebhookConfigResponse {
    code?: number;
    result?: {
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
    code: number;
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
    'X-PF-Store-Id'?: string;
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
    result?: {
        default_url: string | null;
        expires_at: number | null;
        events: EventConfiguration[];
        public_key: string;
    };
    error?: {
        reason: string;
        message: string;
    };
}

export interface SetWebhookEventRequestParam {
    name: string;
    value: { id: number }[];
}

export interface SetWebhookEventRequest {
    type: string;
    url: string;
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

