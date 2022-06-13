import React, { Children } from 'react'
import {createServerEffectContext, getAllContexts} from 'pwa-kit-react-sdk/ssr/universal/server-effects'

// NOTE: This is the important part of the API, here we get a context with a hook that will
// use that context.
const {ServerEffectContext, useServerEffect} = createServerEffectContext('scapiHooks')

const SCAPIContext = React.createContext()

const initialValue = {name: 'scapiHooks', data: {}, requests: []}

export const SCAPIProvider = (props) => {
    // TODO: Figure out a cleaner API for getting the current value for the context.
    const {scapiHooks} = getAllContexts()
    const effectsValues = typeof window === 'undefined' ? scapiHooks || initialValue : window.__PRELOADED_STATE__.scapiHooks

    return (
        <SCAPIContext.Provider>
            <ServerEffectContext.Provider value={effectsValues}>
                {props.children}
            </ServerEffectContext.Provider>
        </SCAPIContext.Provider>
    )
}

export const useProduct = (id, source) => {
    const {product} = useServerEffect(async () => {
        console.log('Getting Product Data from SCAPI hooks.')
        // Emulate netword delay
        await sleep(1000)

        return {
            product: testProduct
        }
    })

    return {product}
}

// PRIVATE
// const getValues = () => (effectsValues)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const testProduct = {
    id: '1',
    name: 'Dress Pants'
}