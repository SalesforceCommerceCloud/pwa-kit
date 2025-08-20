import { type LoaderFunctionArgs } from 'react-router';
import type { ShopperSearchTypes } from 'commerce-sdk-isomorphic';
import { getCommerceApiToken } from '@/utils/api/commerce-api';
import { fetchSearchProducts } from '@/utils/api/commerce-client.server';
import ProductGrid from '@/components/productGrid';
import CategoryRefinements from '@/components/categoryRefinements';
import CategorySorting from '@/components/categorySorting';
import CategoryPagination from '@/components/categoryPagination';

const limit = 24;

export async function loader({ request }: LoaderFunctionArgs): Promise<{
    searchTerm: string;
    searchResult: ShopperSearchTypes.ProductSearchResult;
}> {
    const { searchParams } = new URL(request.url);
    const [session] = await getCommerceApiToken(request);
    const page = parseInt(searchParams.get('page') || '1', 10) - 1;
    const q = searchParams.get('q') ?? '';
    const sort = searchParams.get('sort') ?? '';
    const refine = searchParams.getAll('refine');
    const searchResult = await fetchSearchProducts(session.data, {
        q,
        limit,
        page,
        sort,
        refine
    });
    return { searchTerm: q, searchResult };
}

export default function Search({
    loaderData: { searchTerm, searchResult }
}: {
    loaderData: {
        searchTerm: string;
        searchResult: ShopperSearchTypes.ProductSearchResult;
    };
}) {
    return (
        <div className="pb-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p>Search Results for</p>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {searchTerm} ({searchResult.total})
                        </h1>
                    </div>

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
