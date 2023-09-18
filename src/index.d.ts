declare module "@medusajs/medusa/dist/models/product" {
    interface Product {
        synced: boolean;
        printful_id?: string;
    }
}

declare module "@medusajs/medusa/dist/types/product" {
    interface UpdateProductInput {
        synced: boolean;
        printful_id?: string;
    }
    interface CreateProductInput {
        synced: boolean;
        printful_id?: string;
    }
}

declare module "@medusajs/medusa/dist/models/product-variant" {
    interface ProductVariant {
        printful_id?: string;
    }
}
declare module "@medusajs/medusa/dist/models/product-variant" {
    interface CreateProductVariantInput {
        printful_id?: string;
    }
    interface UpdateProductVariantInput {
        printful_id?: string;
    }
}

export interface PrintfulOrder {
    external_id: string;
    shipping: string;
    recipient: {
        name: string;
        company: string;
        address1: string;
        address2: string;
        city: string;
        state_code: string;
        state_name: string;
        country_code: string;
        country_name: string;
        zip: string;
        phone: string;
        email: string;
        tax_number: string;
    };
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

