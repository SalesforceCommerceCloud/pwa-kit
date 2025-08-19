import type { ReactElement } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import type { ShopperProductsTypes } from 'commerce-sdk-isomorphic';
import { getCommerceApiToken } from '@/utils/api/commerce-api';
import { 
    fetchProductsGetProduct,
    fetchProductsGetCategory 
} from '@/utils/api/commerce-client.server';
import ProductDetailView from './productDetail';
import ProductCarousel from '@/components/productCarousel';

export async function loader({ request, params }: LoaderFunctionArgs): Promise<{
    product: ShopperProductsTypes.Product;
    category?: ShopperProductsTypes.Category;
}> {
    const { searchParams } = new URL(request.url);
    const [session] = await getCommerceApiToken(request);
    const { productId = '' } = params;
    
    // Check for variant product ID in search params (for product variants)
    const pid = searchParams.get('pid') || productId;
    
    const product = await fetchProductsGetProduct(session.data, {
        id: pid,
        expand: [
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
        allImages: true,
        perPricebook: true
    });

    // Fetch category data if available
    let category: ShopperProductsTypes.Category | undefined;
    if (product.primaryCategoryId) {
        try {
            category = await fetchProductsGetCategory(session.data, {
                id: product.primaryCategoryId,
                levels: 1
            });
        } catch (error) {
            // Category fetch is optional
            console.warn('Failed to fetch category:', error);
        }
    }

    return { product, category };
}

export default function Product({
    loaderData: { product, category }
}: {
    loaderData: {
        product: ShopperProductsTypes.Product;
        category?: ShopperProductsTypes.Category;
    };
}): ReactElement {
    const isProductASet = product?.type?.set;
    const isProductABundle = product?.type?.bundle;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProductDetailView
                    product={product}
                    category={category}
                    isProductASet={isProductASet}
                    isProductABundle={isProductABundle}
                />
                
                {/* Recommended Products Section */}
                <div className="mt-16">
                    <ProductCarousel title="You might also like" />
                </div>
            </div>
        </div>
    );
}
