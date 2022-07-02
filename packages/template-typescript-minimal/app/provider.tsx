import React from 'react'
import {
    createServerEffectContext,
    getAllContexts,
} from 'pwa-kit-react-sdk/ssr/universal/server-effects'
import useSWR, {SWRConfig} from 'swr'

// NOTE: This is the important part of the API, here we get a context with a hook that will
// use that context.
const {ServerEffectProvider, useServerEffect} = createServerEffectContext('scapiHooks')

const SCAPIContext = React.createContext()
const initialValue = {name: 'scapiHooks', data: {}, requests: []}

export const SCAPIProvider = (props) => {
    const {scapiHooks} = getAllContexts()
    const effectsValues =
        typeof window === 'undefined'
            ? scapiHooks || initialValue
            : window.__PRELOADED_STATE__.scapiHooks

    // TODO: How do we pass the cache key to the server effect context?
    // we need to rename the unpredictable "uh_1-1" to something we know like "shirt"
    // const SWRCache =
    //     typeof window === 'undefined'
    //         ? {}
    //         : {['shirt']: window.__PRELOADED_STATE__.scapiHooks.data['uh_1-1']}

    return (
        <SCAPIContext.Provider value={{}}>
            <ServerEffectProvider value={effectsValues}>
                <SWRConfig value={{fallback: effectsValues.data}}>{props.children}</SWRConfig>
            </ServerEffectProvider>
        </SCAPIContext.Provider>
    )
}

export {useServerEffect}
