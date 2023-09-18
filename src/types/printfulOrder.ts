export interface CreatePrintfulOrderReq {
    external_id?: string;
    shipping?: string;
    recipient: CreatePrintfulOrderRecipient;
    items: {
        external_id?: string;
        quantity: number;
        retail_price?: string;
        name?: string;
        product_options?: [
            {
                name?: string;
                value?: any[];
            }
        ]
        placements?: any[];
        variant_id?: number;
        source?: string;
    }
    customization?: any;
    retail_costs?: {
        currency?: string;
        discount?: string;
        shipping?: string;
        tax?: string;
    }
}

export interface CreatePrintfulOrderRes {
    external_id: string;
    shipping: string;
    recipient: CreatePrintfulOrderRecipient;
    items: {
        external_id: string;
        quantity: number;
        retail_price: string;
        name: string;
        product_options: {
            name: string;
            value: any[]; // You may want to specify the type further
        }[];
        placements: any[]; // You may want to specify the type further
        variant_id: number;
        source: string;
    }[];
    customization: {
        gift: Record<string, unknown>; // You may want to specify the type further
        packing_slip: Record<string, unknown>; // You may want to specify the type further
    };
    retail_costs: {
        currency: string;
        discount: string;
        shipping: string;
        tax: string;
    };
}

export interface GetPrintfulOrderReq {
    order_id: string;
    external_id?: string;
    store_id?: string;
    status: string
    created_at: string;
    updated_at: string;
    recipient: CreatePrintfulOrderRecipient

}

interface GetPrintfulOrderRes {
    data: {
        id: number;
        external_id: string;
        store_id: number;
        shipping: string;
        status: string;
        created_at: string;
        updated_at: string;
        recipient: CreatePrintfulOrderRecipient;
        costs?: {
            calculation_status: string;
            currency: string;
            subtotal: string;
            discount?: string;
            shipping: string;
            digitization?: string;
            additional_fee?: string;
            fulfillment_fee?: string;
            retail_delivery_fee?: string;
            vat?: string;
            tax?: string;
            total: string;
        };
        retail_costs?: {
            calculation_status: string;
            currency: string;
            subtotal: string;
            discount?: string;
            shipping: string;
            vat?: string;
            tax?: string;
            total: string;
        };
        order_items?: {
            id: number;
            type: string;
            source: string;
            variant_id: number;
            external_id: string;
            quantity: number;
            name: string;
            price: string;
            retail_price: string;
            currency: string;
            retail_currency: string;
            _links?: Record<string, unknown>;
        }[];
        customization?: Record<string, unknown>;
        _links?: {
            self?: Record<string, unknown>;
            order_confirmation?: Record<string, unknown>;
            order_items?: Record<string, unknown>;
            shipments?: Record<string, unknown>;
        };
    };
}


export interface CreatePrintfulOrderRecipient {
    name?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state_code?: string;
    state_name?: string;
    country_code?: string;
    country_name?: string;
    zip?: string;
    phone?: string;
    email?: string;
    tax_number?: string;
}
