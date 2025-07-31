import type {ReactElement} from 'react'
import {QueryClient} from '@tanstack/react-query'
import {getServerContext} from '@/app/utils/serverContext'
import {CommerceServerContext} from '@/app/providers/commerce.server'
import {createProductsGetCategoryQuery} from '@/app/utils/api/commerce-client-queries'
import NavigationDesktopClient from './desktop.client'

/**
 * This navigation component illustrates the concept of a component that independently loads all the
 * data it needs from the server and transfers it to its associated subcomponents. Such a component
 * can be imagined as drag-and-droppable via visual tooling, e.g., Page Designer.
 *
 * What is special about this component is that, in addition to the preferred server-side data
 * retrieval, it also shows the possible integration of downstream client-side data retrieval –
 * additionally “hidden” behind a lazy-loaded client component. However, the component also makes
 * it very clear what price you have to pay for client-side data loading, or what you have to be
 * prepared to pay. This is because the additional third-party scripts required on the client
 * (essentially TanStack Query) alone account for quite a few extra kilobytes. This is basically
 * only a necessary penalty if you have to deal with thousands of subcategories. Otherwise, thanks
 * to React Server Components (RSC), you can easily do without client-side data retrieval altogether.
 */
export default async function NavigationDesktop(): Promise<ReactElement> {
    const context = getServerContext(CommerceServerContext)
    if (!context?.session) {
        throw new Error('Unexpected State: No commerce context provided.')
    }

    const queryClient = new QueryClient()
    const category = await queryClient.fetchQuery(
        createProductsGetCategoryQuery(context.session, {
            id: 'root',
            levels: 1
        })
    )

    // const dehydratedState = await dehydrateQuery(
    //     createProductsGetCategoryQuery(context.session, {
    //         id: 'root',
    //         levels: 1
    //     })
    // )
    return (
        // <HydratedQueryProvider state={dehydratedState}>
        <NavigationDesktopClient category={category} />
        // </HydratedQueryProvider>
    )
}
