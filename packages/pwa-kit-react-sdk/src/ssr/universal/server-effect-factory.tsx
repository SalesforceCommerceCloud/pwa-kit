import React, {useContext, useState, useEffect} from 'react'
import {useLocation, useParams} from 'react-router-dom'
import {useUID} from 'react-uid' // TODO: Probably not required

const isClient = typeof window !== 'undefined'

// Globals
const allContexts = []

/**
 * 
 * @param initial 
 * @param didUpdate 
 * @param source 
 * @returns 
 */
function useServerEffect (initial, didUpdate, source) {
    // Function overloading.
    if (typeof initial === 'function') {
        source = didUpdate
        didUpdate = initial
        initial = undefined
    }

    const key = useUID()
    const location = useLocation()
    const params = useParams()
    const value = useContext(this.context)

    const [data, setData] = useState(value.data[key] || initial)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(undefined)

    if (isClient) {
        useEffect(async () => {
            let data

            setLoading(true)

            try {
                data = await didUpdate({location, params})
                setData(data)
            } catch(e) {
                setError(e)
            }

            setLoading(false)
        }, source)
    } else {
        // NOTE: In contexts where the server is long lived (e.g. the dev server),
        // you'll continually push requests onto the context's array. This results 
        // in effects firing that have already got their data. Consider creating the 
        // `requests` storage object as dictionairy so that we don't have duplicate
        // entries. Dual pass rendering also doesn't help this issue ;)
        // In general this logic should be revisited. 
        value.requests.push({
            effect: didUpdate.bind(this, {location, params}),
            fireEffect: function () {
                const currentValue = value.data[key]

                // If there is a value already, return it.
                if (currentValue) {
                    return Promise.resolve(currentValue)
                }

                return Promise.resolve()
                    .then(this.effect)
                    .then((data) => {
                        if (data) {
                            value.data[key] = data

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
        loading,
        error,
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
const createServerEffect = (context) => (
    (...args) => (
        useServerEffect.apply({
            ...(this as object),
            context
        }, args)
    )
)

/**
 * Create a provider for use with hooks created with the paired createSeverEffect function.
 *
 * @param {string} name - for namspacing and data accessing purposes.
 * 
 * @function
 * 
 * @returns {ServerEffectProvider}
 */
export const createServerEffectContext = (name) => {
    const initialValue = {
        name,
        requests: [],
        data: {},
        resolved: false
    } 
    const Context = React.createContext()
    Context.displayName = name
    const useServerEffect = createServerEffect(Context)


    // This method will trigger and return all the date
    const resolveData = async () => {
        const {requests} = initialValue
        const effectPromises = requests.map((request) => request.fireEffect())
        await Promise.all(effectPromises)

        // Reset the requests
        initialValue.requests = []

        // Use this value to stop the hook from recoring events.
        initialValue.resolved = true

        return {
            [name]: {
                data: initialValue.data
            }
        }
    }

    // Not the best solution, but we'll use this files global scope to
    // track all the contexts created so we can resolve all of them 
    // during the rendering stage.
    allContexts.push(resolveData)

    const ServerEffectProvider = ({children, value}) => {
        if (value) {
            initialValue.data = value
        }

        return (
            <Context.Provider value={initialValue}>
                {children}
            </Context.Provider>
        )
    }

    return {
        ServerEffectProvider,
        useServerEffect,
        resolveData
    }
}


export const resolveAllContext = async () => {
    const allData = await Promise.all(allContexts.map((resolver) => resolver()))
    const map = allData.reduce((acc, curr) => ({
        ...acc,
        ...curr
    }), {})

    return map
}