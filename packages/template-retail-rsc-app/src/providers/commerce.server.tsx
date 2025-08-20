import type { PropsWithChildren, ReactElement } from 'react';
import { createServerContext } from '@/utils/serverContext';
import type { CommerceContext } from './commerce';

export const CommerceServerContext = createServerContext<CommerceContext>(
    {} as CommerceContext
);

export default function CommerceServerProvider({
    children,
    context
}: PropsWithChildren<{ context: CommerceContext }>): ReactElement {
    return (
        <CommerceServerContext.Provider value={context}>
            {children}
        </CommerceServerContext.Provider>
    );
}
