import 'server-only'
import {cache, type ReactElement, type ReactNode} from 'react'

type ServerContext<T> = {
    Provider: ({children, value}: {children: ReactNode; value: T}) => ReactElement
    Consumer: ({children}: {children: (context: T) => ReactNode}) => ReactNode
    get: () => {value: T}
    defaultValue: T
}

const {hasOwnProperty} = Object.prototype

/**
 * This is a critical piece in the puzzle to allow nested server components - i.e., components that don't represent
 * pages that are directly referenced in React Router's config - their own asynchronous data retrieval process. Such
 * an independent component-level data retrieval capability will likely be required for e.g. Page Designer integrations,
 * but will of course not be limited to that.
 *
 * The tricky aspect consists of the fact that the server is a stateless entity, possibly serving multiple requests in
 * parallel. There's no official support in React Router yet to support such nested retrieval scenarios, neither such
 * a concept exists for Next.js. The approach makes use of the {@link React.cache} method that got introduced for React
 * Server Components (RSC). That method creates memoized functions for each server request, which is mentioned as a
 * caveat in the React documentation, but it's actually exactly what saves us here.
 *
 * The approach is inspired by other people's prior art:
 * @see {@link https://react.dev/reference/react/cache}
 * @see {@link https://github.com/markomitranic/nextjs-server-context-workshop/blob/main/src/CreateServerContext/createServerContext.ts}
 * @see {@link https://medium.com/homullus/cursed-server-context-patterns-in-next-js-14-64407c90fdd4}
 * @see {@link https://github.com/manvalls/server-only-context/blob/main/src/index.ts} Most simple approach using `cache`
 */
export function createServerContext<T>(defaultValue: T): ServerContext<T> {
    const getCache = cache<() => {value?: T}>(() => ({}))
    const obj = {} as ServerContext<T>
    Object.defineProperty(obj, 'Provider', {
        enumerable: true,
        value: ({children, value}: {children: ReactNode; value: T}) => {
            getCache().value = value
            return children as ReactElement
        }
    })
    Object.defineProperty(obj, 'Consumer', {
        enumerable: true,
        value: ({children}: {children: (context: T) => ReactNode}) => {
            const store = getCache()
            return children(
                store && hasOwnProperty.call(store, 'value') ? (store.value as T) : defaultValue
            )
        }
    })
    Object.defineProperty(obj, 'get', {value: getCache})
    Object.defineProperty(obj, 'defaultValue', {value: defaultValue})
    return obj
}

export function getServerContext<T>({get, defaultValue}: ServerContext<T>): T {
    const store = get?.()
    return store && hasOwnProperty.call(store, 'value') ? store.value : defaultValue
}
