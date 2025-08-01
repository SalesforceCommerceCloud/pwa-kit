import type {ReactElement} from 'react'
import {getServerContext} from '@/app/utils/serverContext'
import {CommerceServerContext} from '@/app/providers/commerce.server'
import {fetchProductsGetCategory} from '@/app/utils/api/commerce-client.server'
import NavigationDesktopClient from './desktop.client'

/**
 * This navigation component fetches root categories with 1 level of depth on the server,
 * providing immediate access to first-level subcategories. Deeper subcategory levels
 * are fetched on-demand client-side when hovering over categories.
 *
 * This optimized approach:
 * - Minimizes server-side data fetching (only essential navigation structure)
 * - Enables on-demand loading for deeper category trees
 * - Uses commerce-sdk-isomorphic for both server and client-side calls
 * - Eliminates react-query dependency
 */
export default async function NavigationDesktop(): Promise<ReactElement> {
    const context = getServerContext(CommerceServerContext)
    if (!context?.session) {
        throw new Error('Unexpected State: No commerce context provided.')
    }

    // Fetch root categories with first level of subcategories (levels: 1)
    const rootCategory = await fetchProductsGetCategory(context.session, {
        id: 'root',
        levels: 1 // This gives us root + first level subcategories
    })

    return <NavigationDesktopClient category={rootCategory} />
}
