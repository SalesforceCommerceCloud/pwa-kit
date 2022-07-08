import React from 'react'
import {createServerEffectContext} from 'pwa-kit-react-sdk/ssr/universal//server-effect-factory'

// NOTE: This is the important part of the API, here we get a context with a hook that will
// use that context.
const {ServerEffectProvider, useServerEffect} = createServerEffectContext('scapiHooks')

const SCAPIContext = React.createContext()

export const SCAPIProvider = (props) => {
    const effectsValues = typeof window === 'undefined' ? {} : window.__PRELOADED_STATE__.scapiHooks.data
    console.log('effectsValues; ', effectsValues)
    return (
        <SCAPIContext.Provider value={{}}>
            <ServerEffectProvider value={effectsValues}>
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