import React from 'react'
import {createServerEffectContext} from 'pwa-kit-react-sdk/ssr/universal/hooks/use-server-effect'

const CONTEXT_KEY = '__COMMERCE_SDK_REACT__'
// NOTE: This is the important part of the API, here we get a context with a hook that will
// use that context.
const {ServerEffectProvider, useServerEffect} = createServerEffectContext(CONTEXT_KEY)

const SCAPIContext = React.createContext()

export const SCAPIProvider = (props) => {
    
    // Only set the provider value on the client. On the server the context will already have 
    // it's values set.
    const serverEffectProviderValues = 
        typeof window === 'undefined' ? {} : {
            value: window.__PRELOADED_STATE__[CONTEXT_KEY]
        }

    return (
        <SCAPIContext.Provider value={{}}>
            <ServerEffectProvider {...serverEffectProviderValues}>
                {props.children}
            </ServerEffectProvider>
        </SCAPIContext.Provider>
    )
}

export const useProduct = (id, source) => {
    const {data, isLoading, error} = useServerEffect(async () => {
        console.log(`Fetching product with id = ${id}`)
        // Emulate netword delay
        await sleep(1000)

        return testProduct
    }, source)

    return {
        isLoading,
        error,
        product: data
    }
}

// PRIVATE
// const getValues = () => (effectsValues)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const testProduct = {
    id: '1',
    name: 'Dress Pants'
}