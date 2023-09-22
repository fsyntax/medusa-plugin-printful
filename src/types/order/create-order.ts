import {DesignPlacement, Order, OrderItem, ProductOption, Recipient} from "../shared";

export interface CreateOrderRequest {
    external_id: string;
    shipping: string;
    recipient: Recipient;
    items: OrderItem[];
    customization?: {
        gift?: {
            subject: string;
            message: string;
        };
        packing_slip?: {
            email: string;
            phone: string;
            message: string;
            logo_url: string;
            store_name: string;
            custom_order_id: string;
        };
    };
    retail_costs: {
        currency: string;
        discount?: string;
        shipping?: string;
        tax?: string;
    };
}

export interface CreateOrderResponse {
    data: Order;
    code?: number;
    error?: {
        reason: string,
        message: string;
    }
}

export interface ConfirmOrderResponse {
    data: Order;
    links: object;
    code?: number;
    error?: {
        reason: string,
        message: string;
    }
}
