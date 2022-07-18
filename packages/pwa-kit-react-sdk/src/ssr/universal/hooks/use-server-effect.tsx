/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext, useState, useEffect} from 'react'
import {useLocation, useParams} from 'react-router-dom'
import {useUID} from 'react-uid' // TODO: Probably not required
import useExpress from './use-express'

// Globals
export const DEFAULT_CONTEXT_KEY = '__SERVER_EFFECTS__'
const contexts = []
const isServer = typeof window === 'undefined'

// Type Definitions
type ServerEffectState = {
    data: object; // The value returned from the `useServerEffect` didUpdate function
    loading: boolean; // Is didUpdate is resolved.
    error: Error; // The error object if an error was thrown during execution of the didUpdate call
}
type ServerEffectArgs = {
    location: Location;
    params: object;
    extraGetPropsArgs: object;
    req: boolean;
    res: Error;
}
type DidUpdateFn = (serverEffectArgs: ServerEffectArgs) => Promise<any>
type EffectsResolver = () => Promise<{[x: string]: {}}>
type Provider = ({ children, value }: { children: any; value: any; }) => JSX.Element
type ServerEffect = (initialValue: Object, didUpdate: DidUpdateFn, source: any[]) => ServerEffectState
type ServerEffectContext = {
    /**
    * ServerEffectProvider: The React provider you must wrap you application with in order to use
    * the accompanied hook.
    */
    ServerEffectProvider: Provider; // Can we get more specifc here? provider type?
    /**
    * useServerEffect: A useEffect style hook that can be used client and server side to run async
    * actions.
    */
    useServerEffect: ServerEffect;
    /**
    * resolveEffects: For use on the server side only, this async function will can be called to invoke
    * all the recorded async "didUpdate" functions.
    */
    resolveEffects: EffectsResolver;
}
type ServerEffectContextValue = {
    name: string;
    data: string;
    requests: DidUpdateFn[];
    resolved: boolean;
}

/**
 * This function is creating `useServerEffect`, it's only going to be used
 * but the SDK, this isn't for external libs.
 * 
 * @param {*} context 
 * @returns 
 */
const createServerEffect = (context) => {
    function useServerEffect(didUpdate: DidUpdateFn, source: any[]) : ServerEffectState
    function useServerEffect(initial: Object | undefined, didUpdate: DidUpdateFn, source: any[]) : ServerEffectState
    function useServerEffect(initialOrDidUpdateFn: Object | undefined | DidUpdateFn, didUpdateOrSource: DidUpdateFn | any[], source?: any[]) : ServerEffectState {
        let initial, didUpdate, internalSource

        // Handle optional first param.
        if (typeof initialOrDidUpdateFn === 'function') {
            initial = undefined
            didUpdate = initialOrDidUpdateFn
            internalSource = didUpdateOrSource
        } else {
            didUpdate = didUpdateOrSource
            initial = initialOrDidUpdateFn
            internalSource = source
        }
    
        const key = useUID()
        const location = useLocation()
        const params = useParams()
        const {
            data: contextData,
            requests: contextRequests,
            resolved: contextResolved
        }: ServerEffectContextValue = useContext(context)
        // TODO: Think about a better name for this hook if we are going to slip in the 
        // extra props with the request and response. Otherwise maybe create another to 
        // home the extra props values.
        const expressValues = useExpress()
        const [data, setData] = useState(contextData[key] || initial)
        const [loading, setLoading] = useState(false)
        const [error, setError] = useState(undefined)
        const boundDidUpdate = didUpdate.bind(this, {location, params, ...expressValues})

        const wrappedDidUpdate = isServer ? 
            () => {} : 
            async () => {
                // Set loading state to "true"
                setLoading(true)
        
                try {
                    const data = await boundDidUpdate()
                    setData(data)
                } catch(e) {
                    setLoading(false)
                    setError(e)
                }
        
                // Set loading state to false
                setLoading(false)
            }
    
        if (!contextResolved && isServer) {
            contextRequests.push(async () => {
                const data = await boundDidUpdate()
    
                return {
                    [key]: data
                }
            })
        }
    
        // To avoid messing with React's hooks order lets make this a
        // noop for the server.
        useEffect(wrappedDidUpdate, internalSource)
    
        return {
            loading,
            error,
            data
        }
    }

    return (...args) => (
        useServerEffect.apply(this, args)
    )
}

/**
 * Create a provider for use with hooks created with the paired createSeverEffect function.
 *
 * @param {string} name - for namspacing and data accessing purposes.
 * 
 * @function
 * 
 * @returns {ServerEffectProvider}
 */
export const createServerEffectContext = (name: string): ServerEffectContext => {
    const contextValue = {
        name,
        requests: [],
        data: {},
        resolved: false
    } 
    const Context = React.createContext({})
    Context.displayName = name
    const useServerEffect = createServerEffect(Context)

    // This method will trigger and return all the date
    const resolveEffects: EffectsResolver = async () => {
        const {requests, data, resolved, name} = contextValue

        // Early exit for resolved contexts.
        if (resolved) {
            return {
                [name]: data
            }
        }

        const serializeCalls = true
        const effectPromises = serializeCalls ? 
            [requests.reduce((acc, curr) => {
                return acc.then((data) => curr(data).then((newData) => ({...data, ...newData})))
            }, Promise.resolve({}))]
            : requests.map((effect) => effect())
        const effectValues = await Promise.all(effectPromises)
        // Reset the requests
        contextValue.requests = []

        // Use this value to stop the hook from recoring events.
        contextValue.resolved = true

        // Turn the data in to a map to se the context value
        contextValue.data = effectValues.reduce((acc, curr) => ({
            ...acc,
            ...curr
        }), {})

        return {
            [name]: {
                ...contextValue.data
            }
        }
    }

    // Not the best solution, but we'll use this files global scope to
    // track all the contexts created so we can resolve all of them 
    // during the rendering stage.
    contexts.push(resolveEffects)

    const ServerEffectProvider = ({children, value}) => {
        if (value) {
            contextValue.data = value
        }

        return (
            <Context.Provider value={contextValue}>
                {children}
            </Context.Provider>
        )
    }

    return {
        ServerEffectProvider,
        useServerEffect,
        resolveEffects
    }
}


/**
 * 
 * @returns 
 */
export const resolveAllEffects = async () => {
    const allData = await Promise.all(contexts.map((resolver) => resolver()))

    return allData.reduce((acc, curr) => ({
        ...acc,
        ...curr
    }), {})
}

// Create a singleton instance of the hook/provider and associated functions. We do this because we
// set up the provider in the client and server applications. No need to worry about using the provider
// in userland unless you are making a custom provider.
export const {ServerEffectProvider, useServerEffect, resolveEffects} = createServerEffectContext(DEFAULT_CONTEXT_KEY)

export default useServerEffect
