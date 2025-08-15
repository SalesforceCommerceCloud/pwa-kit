import type { ReactElement } from 'react';
import { Link } from 'react-router';
import type { ShopperSearchTypes } from 'commerce-sdk-isomorphic';
import { formatCurrency } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function ProductCard({
    product
}: {
    product: ShopperSearchTypes.ProductSearchHit;
}): ReactElement {
    return (
        <div className="group">
            <Card>
                <CardContent>
                    <div className="group">
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                            {/* Product Image */}
                            <Link to={`/product/${product.productId}`}>
                                <img
                                    src={`${product.image?.disBaseLink ?? product.image?.link}?sw=300&q=60`}
                                    alt={product.productName}
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                            </Link>

                            {/* Select Variant */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    asChild
                                    variant="secondary"
                                    className="w-full"
                                >
                                    <Link to={`/product/${product.productId}`}>
                                        Select Variant
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    {/* Product Info */}
                    <Link
                        to={`/product/${product.productId}`}
                        className="block group-hover:underline"
                    >
                        <h3 className="text-lg font-medium text-gray-900">
                            {product.productName}
                        </h3>

                        <p className="mt-2 font-medium text-gray-900">
                            {formatCurrency(product.price ?? 0)}
                        </p>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
