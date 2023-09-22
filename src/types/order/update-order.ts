export interface UpdateOrderRequest {
    id: string | number;
    external_id?: string;
    shipping?: string;
    recipient?: {
        name: string;
        company?: string;
        address1: string;
        address2?: string;
        city: string;
        state_code?: string;
        state_name?: string;
        country_code: string;
        country_name?: string;
        zip: string;
        phone?: string;
        email?: string;
        tax_number?: string;
    };
    items: Array<{
        id?: number;
        external_id?: string;
        variant_id?: number;
        sync_variant_id?: number;
        external_variant_id?: string;
        warehouse_product_variant_id?: number;
        product_template_id?: number;
        external_product_id?: string;
        quantity?: number;
        price?: string;
        retail_price?: string;
        name?: string;
        product?: {
            variant_id?: number;
            product_id?: number;
            image?: string;
            name?: string;
        };
        files?: Array<{
            type?: string;
            url?: string;
            options?: Array<{
                id?: string;
                value?: string;
            }>;
            filename?: string;
            visible?: boolean;
            position?: {
                area_width?: number;
                area_height?: number;
                width?: number;
                height?: number;
                top?: number;
                left?: number;
                limit_to_print_area?: boolean;
            };
        }>;
        options?: Array<{
            id?: string;
            value?: string;
        }>;
        sku?: string | null;
        discontinued?: boolean;
        out_of_stock?: boolean;
    }>;
    retail_costs?: {
        currency?: string;
        subtotal?: string;
        discount?: string;
        shipping?: string;
        tax?: string;
    };
    gift?: {
        subject?: string;
        message?: string;
    };
    packing_slip?: any;
}

export interface UpdateOrderResponse {
    code: number;
    error?: {
        reason: string;
        message: string;
    }
    result: {
        id: number;
        external_id?: string | null;
        store: number;
        status: string;
        shipping: string;
        shipping_service_name?: string | null;
        created: number;
        updated: number;
        address: {
            name: string;
            company?: string | null;
            address1: string;
            address2?: string | null; // Optional
            city: string;
            state_code: string;
            state_name: string;
            country_code: string;
            country_name: string;
            zip: string;
            phone?: string | null; // Optional
            email?: string | null; // Optional
            tax_number?: string | null; // Optional
        };
        items: Array<{
            id: number;
            external_id?: string | null; // Optional
            variant_id: number;
            sync_variant_id?: number | null; // Optional
            external_variant_id?: string | null; // Optional
            warehouse_product_variant_id?: number | null; // Optional
            product_template_id?: number | null; // Optional
            external_product_id?: string | null; // Optional
            quantity: number;
            price: string;
            retail_price: string;
            name: string;
            product?: {
                variant_id?: number | null; // Optional
                product_id?: number | null; // Optional
                image?: string | null; // Optional
                name?: string | null; // Optional
            };
            files: Array<{
                type?: string | null; // Optional
                url?: string | null; // Optional
                options: Array<{
                    id?: string | null; // Optional
                    value?: string | null; // Optional
                }>;
                filename?: string | null; // Optional
                visible: boolean;
                position: {
                    area_width?: number | null; // Optional
                    area_height?: number | null; // Optional
                    width?: number | null; // Optional
                    height?: number | null; // Optional
                    top?: number | null; // Optional
                    left?: number | null; // Optional
                    limit_to_print_area?: boolean | null; // Optional
                };
            }>;
            options: Array<{
                id?: string | null; // Optional
                value?: string | null; // Optional
            }>;
            sku?: string | null; // Optional
            discontinued?: boolean; // Optional
            out_of_stock?: boolean; // Optional
        }>;
        retail_costs: {
            currency: string;
            subtotal?: string | null; // Optional
            discount: string;
            shipping: string;
            tax?: string | null; // Optional
        };
        gift?: {
            subject?: string | null; // Optional
            message?: string | null; // Optional
        };
        packing_slip?: Record<string, any> | null; // Optional
    };
}
