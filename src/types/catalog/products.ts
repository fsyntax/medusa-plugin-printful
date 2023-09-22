import { Product } from '../shared';

export interface GetProductsResponse {
    data: Product[];
    paging: {
        total: number;
        offset: number;
        limit: number;
    };
    _links: {
        self: {
            href: string;
        };
        next?: {
            href: string;
        };
        first: {
            href: string;
        };
        last: {
            href: string;
        };
    };
}
