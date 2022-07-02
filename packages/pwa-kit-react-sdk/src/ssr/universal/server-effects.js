import React, {useContext, useState, useEffect} from 'react'
import {useLocation, useParams} from 'react-router-dom'
import {useUID} from 'react-uid'
import {useExpress} from './hooks'

const isClient = typeof window !== 'undefined'

// Globals
export const DEFAULT_CONTEXT_KEY = '__SERVER_EFFECTS__'

// NOTE: These globals are probably bad, think of ways to replace them.
const contexts = []
const allContexts = {}

// NOTE: Not sure how this defaultValue is supposed to work, think it out more.
const initialValue = {
    requests: [],
    data: {}
}

export const getContexts = () => (contexts)
export const getAllContexts = () => (allContexts)

/**
 * 
 * @param {*} initial 
 * @param {*} effect 
 * @returns 
 */
function useServerEffect(initial, didUpdate, source, cacheKey) {
    let key
    // Function overloading.
    if (typeof initial === 'function') {
        key = source
        source = didUpdate
        didUpdate = initial
        initial = {}
    }

    key = key || cacheKey || `uh_${useUID()}`
    const location = useLocation()
    const params = useParams()
    const {req, res} = useExpress()

    const context = this.context
    const contextValues = useContext(context)

    allContexts[context.displayName] = contextValues

    const [data, setData] = useState(contextValues.data[key] || initial)
    const [isLoading, setIsLoading] = useState(false)
    // const [ignoreFirst, setIgnoreFirst] = useState(true)

    if (isClient) {
        // Note: This is only executed on the client.
        // TODO: We need to allow the user to control the second paramater of this
        // effect, also setting it's default value.
        // TODO: Effect should be passed the extra args defined in the AppConfig.

        useEffect(() => {
            // NOTE: This logic needs to be fixed. It should look at the hydrating 
            // global value to determine whether or not to ignore. I think.
            // if (ignoreFirst) {
            //     setIgnoreFirst(false)
            //     return
            // }

            Promise.resolve()
                .then(() => {
                    setIsLoading(true)
                })
                .then(() => {
                    return didUpdate({location, params})
                }).then((data) => {
                    setData(data)
                }).then(() => {
                    setIsLoading(false)
                })
        }, source)
    } else {

        if (!contextValues) {
            throw new Error('Server Effect Context Not Found')
        }

        // NOTE: In contexts where the server is long lived (e.g. the dev server),
        // you'll continually push requests onto the context's array. This results 
        // in effects firing that have already got their data. Consider creating the 
        // `requests` storage object as dictionairy so that we don'thave duplicate
        // entries. Dual pass rendering also doesn't help this issue ;)
        // In general this logic should be revisited. 
        contextValues.requests.push({
            effect: didUpdate.bind(this, {req, res, location, params}),
            fireEffect: function () {
                const value = contextValues.data[key]

                if (value) {
                    return Promise.resolve(value)
                }

                return Promise.resolve()
                    .then(this.effect)
                    .then((data) => {
                        if (data) {
                            contextValues.data[key] = data

                            return {
                                [key]: data
                            }
                        } else {
                            throw new Error('`useServerEffect` must return a value.')
                        }
                    })  
            }
        })
    }

    return {
        isLoading,
        data
    }
}

/**
 * This function is creating `useServerEffect`, it's only going to be used
 * but the SDK, this isn't for external libs.
 * 
 * @param {*} context 
 * @returns 
 */
const createServerEffect = (context) => {
    return (...args) => {
        return useServerEffect.apply({
            ...this,
            context
        }, args)
    }
}

/**
 * Create a provider for use with hooks created with the paired createSeverEffect function.
 *
 * @param {string} path - relative path from the build directory to the asset
 * @function
 * 
 * @returns {ServerEffectProvider}
 */
export const createServerEffectContext = (name, extraArgs) => {
    const context = React.createContext({name, ...initialValue})
    context.displayName = name
    const hook = createServerEffect(context)

    // Push the context on so we can get it's data later.
    contexts.push(context)

    return {
        ServerEffectProvider: context.Provider,
        useServerEffect: hook
    }
}

const defaultContext = createServerEffectContext(DEFAULT_CONTEXT_KEY)

const {ServerEffectProvider: DefaultServerEffectProdiver, useServerEffect: defaultUseServerEffect} = defaultContext

export {
    DefaultServerEffectProdiver as ServerEffectProvider,
    defaultUseServerEffect as useServerEffect
}