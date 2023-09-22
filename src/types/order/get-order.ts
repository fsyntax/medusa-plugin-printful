import {Order} from "../shared";

export interface GetOrderResponse {
    data: Order;
    error?: {
        reason: string,
        message: string;
    }
}

export interface GetOrderRequest {
    order_id: string | number;
}
