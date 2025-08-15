import type { PropsWithChildren, ReactElement } from 'react';
import CommerceServerProvider from './commerce.server';
import CommerceClientProvider from './commerce.client';
import CartStoreProvider from './cart-store';
import type { SessionData } from '@/utils/api/commerce-api';

export type CommerceContext = {
    session: SessionData;
};

/**
 * Isomorphic provider for the commerce context.
 */
export default function CommerceProvider({
    children,
    context
}: PropsWithChildren<{ context: CommerceContext }>): ReactElement {
    return (
        <CommerceServerProvider context={context}>
            <CommerceClientProvider context={context}>
                <CartStoreProvider>{children}</CartStoreProvider>
            </CommerceClientProvider>
        </CommerceServerProvider>
    );
}
