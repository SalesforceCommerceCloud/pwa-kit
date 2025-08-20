import type { ReactNode } from 'react';
import { getServerContext } from '@/utils/serverContext';
import { CommerceServerContext } from '@/providers/commerce.server';
import { fetchSearchProducts } from '@/utils/api/commerce-client.server';

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from '@/components/ui/carousel';
import ProductCard from '@/components/productCard';

/**
 * This carousel component illustrates the concept of a component that independently loads the data
 * it needs from the server and transfers it to its associated subcomponents. Such a component can
 * be imagined as drag-and-droppable via visual tooling, e.g., Page Designer. By using some sort of
 * `<slot>` concept, this component could be optimized even further, for example by projecting the
 * `title` of the component across multiple levels into one of the child elements. In this case,
 * the title area would also lie outside the boundary that finally gets hydrated. It would then be
 * fully static server-rendered content as well.
 * @see {@link https://sandroroth.com/blog/react-slots/}
 */
export default async function ProductCarousel({
    title
}: {
    title?: string;
}): Promise<ReactNode> {
    const context = getServerContext(CommerceServerContext);
    if (!context?.session) {
        throw new Error('Unexpected State: No commerce context provided.');
    }

    const searchResult = await fetchSearchProducts(context.session, {
        categoryId: 'root',
        limit: 12
    });
    const products = searchResult.hits ?? [];

    if (products.length === 0) {
        return null;
    }

    return (
        <>
            {title && <h2 className="text-2xl font-bold pb-4">{title}</h2>}

            <Carousel
                opts={{
                    align: 'start',
                    // loop: true,
                    slidesToScroll: 'auto'
                }}
            >
                <CarouselContent className="-ml-1">
                    {products.map((product) => (
                        <CarouselItem
                            key={product.productId}
                            className="pl-1 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                        >
                            <div className="flex-none w-60 md:w-72 snap-start">
                                <ProductCard product={product} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </>
    );
}
