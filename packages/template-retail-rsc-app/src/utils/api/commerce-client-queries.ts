import type { FetchQueryOptions } from '@tanstack/react-query';
import type {
    ShopperProductsTypes,
    ShopperSearchTypes
} from 'commerce-sdk-isomorphic';
import type { SessionData } from '@/utils/api/commerce-api';
import {
    createShopperProductsClient,
    createShopperSearchClient
} from '@/utils/api/commerce-client';

export const createProductsGetCategoryQuery = (
    session: SessionData,
    parameters: {
        id: string | null;
        levels?: number;
    }
): FetchQueryOptions<ShopperProductsTypes.Category> => {
    return {
        queryKey: ['products', 'getCategory', parameters],
        queryFn: (): Promise<ShopperProductsTypes.Category> => {
            const client = createShopperProductsClient(session);
            return client.getCategory({
                parameters: {
                    ...parameters,
                    id: parameters.id ?? ''
                }
            });
        }
    };
};

export const createProductsGetProductQuery = (
    session: SessionData,
    parameters: {
        id: string;
        expand?: string[];
        allImages?: boolean;
        perPricebook?: boolean;
    }
): FetchQueryOptions<ShopperProductsTypes.Product> => {
    const {
        id,
        expand = [
            'availability',
            'bundled_products',
            'images',
            'options',
            'page_meta_tags',
            'prices',
            'promotions',
            'set_products',
            'variations'
        ],
        allImages = true,
        perPricebook = true
    } = parameters;

    return {
        queryKey: ['products', 'getProduct', parameters],
        queryFn: (): Promise<ShopperProductsTypes.Product> => {
            const client = createShopperProductsClient(session);
            return client.getProduct({
                parameters: {
                    id,
                    expand,
                    allImages,
                    perPricebook
                }
            });
        }
    };
};

export const createSearchProductsQuery = (
    session: SessionData,
    parameters: {
        categoryId?: string;
        q?: string;
        filters?: Record<string, string[]>;
        sort?: string;
        limit?: number;
        page?: number;
        expand?: string[];
        refine?: string[];
        // select?: string
        // currency?: string
        // allImages?: boolean
        // allVariationProperties?: boolean
        // perPricebook?: boolean
    }
): FetchQueryOptions<ShopperSearchTypes.ProductSearchResult> => {
    const {
        categoryId,
        q = '',
        filters,
        sort = '',
        limit = 24,
        page = 0,
        expand = [
            'custom_properties',
            'images',
            'prices',
            'promotions',
            'variations'
        ],
        refine = []
    } = parameters || {};

    // Build refinements for product search
    const refineSet = new Set<string>(refine);
    categoryId && refineSet.add(`cgid=${categoryId}`);
    if (filters) {
        Object.entries(filters).forEach(([key, values]) => {
            values.forEach((value) => {
                refineSet.add(`${key}=${value}`);
            });
        });
    }
    return {
        queryKey: ['search', 'productSearch', parameters],
        queryFn: (): Promise<ShopperSearchTypes.ProductSearchResult> => {
            const client = createShopperSearchClient(session);
            return client.productSearch({
                parameters: {
                    q,
                    sort,
                    limit,
                    expand,
                    refine: [...refineSet],
                    offset: page * limit
                }
            }) as unknown as Promise<ShopperSearchTypes.ProductSearchResult>;
        }
    };
};
