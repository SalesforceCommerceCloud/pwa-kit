import type { ReactElement } from 'react';
import { type LoaderFunctionArgs } from 'react-router';
import type {
    ShopperProductsTypes,
    ShopperSearchTypes
} from 'commerce-sdk-isomorphic';
import { getCommerceApiToken } from '@/utils/api/commerce-api';
import {
    fetchProductsGetCategory,
    fetchSearchProducts
} from '@/utils/api/commerce-client.server';
import ProductGrid from '@/components/productGrid';
import CategoryBreadcrumbs from '@/components/categoryBreadcrumbs';
import CategoryRefinements from '@/components/categoryRefinements';
import CategorySorting from '@/components/categorySorting';
import CategoryPagination from '@/components/categoryPagination';

const limit = 24;

export async function loader({ request, params }: LoaderFunctionArgs): Promise<{
    searchResult: ShopperSearchTypes.ProductSearchResult;
    category: ShopperProductsTypes.Category;
}> {
    const { searchParams } = new URL(request.url);
    const [session] = await getCommerceApiToken(request);
    const { categoryId = '' } = params;
    const page = parseInt(searchParams.get('page') || '1', 10) - 1;
    const sort = searchParams.get('sort') ?? '';
    const refine = searchParams.getAll('refine');
    const [searchResult, category] = await Promise.all([
        fetchSearchProducts(session.data, {
            categoryId,
            limit,
            page,
            sort,
            refine
        }),
        fetchProductsGetCategory(session.data, { id: categoryId })
    ]);
    return { searchResult, category };
}

export default function Category({
    loaderData: { searchResult, category }
}: {
    params: Record<string, any>;
    loaderData: {
        searchResult: ShopperSearchTypes.ProductSearchResult;
        category: ShopperProductsTypes.Category;
    };
}): ReactElement {
    return (
        <div className="pb-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-4">
                    <CategoryBreadcrumbs category={category} />
                </div>

                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {category?.name || category.id} ({searchResult.total})
                    </h1>

                    <div className="flex-shrink-0">
                        <CategorySorting result={searchResult} />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <CategoryRefinements result={searchResult} />
                    </div>

                    <div className="flex-grow">
                        <ProductGrid products={searchResult.hits ?? []} />

                        {searchResult.total > 1 && (
                            <div className="mt-10">
                                <CategoryPagination
                                    limit={limit}
                                    result={searchResult}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
