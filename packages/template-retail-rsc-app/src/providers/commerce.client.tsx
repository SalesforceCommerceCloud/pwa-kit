'use client'

import {createContext, type PropsWithChildren, type ReactElement} from 'react'
import type {CommerceContext} from './commerce'

export const CommerceClientContext = createContext<CommerceContext>({} as CommerceContext)

export default function CommerceClientProvider({
    children,
    context
}: PropsWithChildren<{context: CommerceContext}>): ReactElement {
    return (
        <CommerceClientContext.Provider value={context}>{children}</CommerceClientContext.Provider>
    )
}
