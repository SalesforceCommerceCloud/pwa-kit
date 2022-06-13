import React, { Children } from 'react'
import {createServerEffectContext} from 'pwa-kit-react-sdk/ssr/universal/hooks/use-server-effect'

const {ServerEffectContext, useServerEffect} = createServerEffectContext('scapiHooks')

// const effectsValues = typeof window === 'undefined' ? {name: 'scapiHooks', data: {}, requests: []} : window.__PRELOADED_STATE__.scapiHooks
// const effectsValues = {name: 'scapiHooks', data: {}, requests: []}

const SCAPIContext = React.createContext()

export const SCAPIProvider = (props) => {

    debugger
    const effectsValues = typeof window === 'undefined' ? {name: 'scapiHooks', data: {}, requests: []} : window.__PRELOADED_STATE__.scapiHooks

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