import { OrderItem } from "../shared";

export interface GetOrderItemsResponse {
    data: OrderItem[];
    links: object;
    code?: number;
    error?: {
        reason: string,
        message: string;
    }
}

export interface GetOrderItemsRequest {
    order_id: string | number;
    type?: "order_item" | "branding_item";
}
