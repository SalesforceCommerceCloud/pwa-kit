import type {PropsWithChildren, ReactElement} from 'react'
import CommerceServerProvider from './commerce.server'
import CommerceClientProvider from './commerce.client'
import type {SessionData} from '@/app/utils/api/commerce-api'

export type CommerceContext = {
    session: SessionData
}

/**
 * Isomorphic provider for the commerce context.
 */
export default function CommerceProvider({
    children,
    context
}: PropsWithChildren<{context: CommerceContext}>): ReactElement {
    return (
        <CommerceServerProvider context={context}>
            <CommerceClientProvider context={context}>{children}</CommerceClientProvider>
        </CommerceServerProvider>
    )
}
