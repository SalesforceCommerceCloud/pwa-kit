import React, {useContext, useState, useEffect} from 'react'
import {useLocation, useParams} from 'react-router-dom'
import {useUID} from 'react-uid'
import {useExpress} from './index'

const isClient = typeof window !== 'undefined'

// NOTE: Not sure how this defaultValue is supposed to work, think it out more.
const initialValue = {
    requests: [],
    data: {}
}

// NOTE: These globals are probably bad, think of ways to replace them.
const contexts = []
const allContexts = {}
const allContextValues = {}

export const getContexts = () => (contexts)
export const getAllContexts = () => (allContexts)
export const getAllContextValues = () => (allContextValues)

/**
 * 
 * @param {*} initial 
 * @param {*} effect 
 * @returns 
 */
 export const useServerEffect = (initial, effect, context) => {
    // Function overloading.
    if (typeof initial === 'function') {
        context = effect
        effect = initial
        initial = {}
    }

    const key = `uh_${useUID()}`
    const location = useLocation()
    const params = useParams()
    const {req, res} = useExpress()
    
    const contextValues = useContext(context)

    allContexts[context.displayName] = contextValues

    const [data, setData] = useState(contextValues.data[key] || initial)
    const [ignoreFirst, setIgnoreFirst] = useState(true)

    if (contextValues.requests) {
        // NOTE: Here I created an object type that has the effect/action and a function to
        // set the action in motion and place the return value in our state. I did this because
        // if we used the solution above the effects are immediately invocked, and because we 
        // render twice, we would end up making those calls to APIs 2 times.
        contextValues.requests.push({
            effect: effect.bind(this, {req, res, location, params}),
            fireEffect: function () {
                return Promise.resolve()
                    .then(this.effect)
                    .then((data) => {
                        if (data) {
                            console.log('Setting context values')
                            contextValues.data[key] = data
                            
                            console.log('Update all context values object')
                            allContextValues[context.displayName] = contextValues.data
                            console.log(allContextValues)

                            return {
                                [key]: data
                            }
                        } else {
                            throw new Error('`useServerEffect` must return a value.')
                        }
                    })  
            }
        })
    } else {
        console.error('ERROR: Context value is not setup correctly.')
    }

    if (isClient) {
        // Note: This is only executed on the client.
        // TODO: We need to allow the user to control the second paramater of this
        // effect, also setting it's default value.
        // TODO: Effect should be passed the extra args defined in the AppConfig.
        useEffect(() => {
            if (ignoreFirst) {
                setIgnoreFirst(false)
                return
            }

            console.log('Runing effect on client...')
            Promise.resolve().then(() => {
                return effect({location, params})
            }).then((data) => {
                setData(data)
            })
        }, [location])
    }

    return data
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
        args.push(context) 
        return useServerEffect.call(this, ...args)
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
        ServerEffectContext: context,
        useServerEffect: hook
    }
}

const defaultContext = createServerEffectContext('sdkHooks')

export default defaultContext