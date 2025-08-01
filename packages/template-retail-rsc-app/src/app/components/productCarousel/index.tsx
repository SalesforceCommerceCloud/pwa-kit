import type {ReactElement} from 'react'
import {getServerContext} from '@/app/utils/serverContext'
import {CommerceServerContext} from '@/app/providers/commerce.server'
import {fetchSearchProducts} from '@/app/utils/api/commerce-client.server'
import ProductCarouselControls from './controls'
import ProductCarouselContent from './content'

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
export default async function ProductCarousel({title}: {title?: string}): Promise<ReactElement> {
    // Get session from server context (loaded once in root.tsx)
    const context = getServerContext(CommerceServerContext)
    if (!context?.session) {
        throw new Error('Unexpected State: No commerce context provided.')
    }

    try {
        console.time('ProductCarousel API call')
        const searchResult = await fetchSearchProducts(context.session, {
            categoryId: 'root',
            limit: 8, // Reduced from 12 to load faster
            expand: ['images', 'prices'] // Only fetch essential data for carousel view
        })
        console.timeEnd('ProductCarousel API call')
        const products = searchResult.hits ?? []

        return (
            <ProductCarouselControls title={title}>
                <ProductCarouselContent products={products}></ProductCarouselContent>

                {/* Show a message when no products are found */}
                {products.length === 0 && (
                    <div className="text-center py-12" data-sfdc-origin="server">
                        <p className="text-lg text-gray-500">No products found.</p>
                    </div>
                )}
            </ProductCarouselControls>
        )
    } catch (error) {
        console.error('ProductCarousel API error:', error)
        // Render a fallback instead of crashing
        return (
            <ProductCarouselControls title={title}>
                <div className="text-center py-12" data-sfdc-origin="server">
                    <p className="text-lg text-gray-500">Unable to load products at this time.</p>
                </div>
            </ProductCarouselControls>
        )
    }
}
