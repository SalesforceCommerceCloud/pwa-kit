'use client'

import type {PropsWithChildren, ReactElement} from 'react'
import {type DehydratedState, HydrationBoundary, QueryClientProvider} from '@tanstack/react-query'
import {getQueryClient} from '@/app/utils/api/commerce-client.client'

export default function HydratedQueryProvider({
    children,
    state
}: PropsWithChildren<{state: DehydratedState}>): ReactElement {
    const queryClient = getQueryClient()
    return (
        <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={state}>{children}</HydrationBoundary>
        </QueryClientProvider>
    )
}
