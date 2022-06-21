import React, {Children, useEffect} from 'react'
import {
    createServerEffectContext,
    getAllContexts
} from 'pwa-kit-react-sdk/ssr/universal/server-effects'
import {useCommerceAPI} from './commerce-api/contexts'
import {isError} from './commerce-api/utils'
import useCustomer from './commerce-api/hooks/useCustomer'

// NOTE: This is the important part of the API, here we get a context with a hook that will
// use that context.
export const {Context: ServerEffect, useServerEffect} = createServerEffectContext('scapiHooks')

const SCAPIContext = React.createContext()

const initialValue = {name: 'scapiHooks', data: {}, requests: []}

const initialState = {
    hello: {data: 'world'},
    baskets: {
        isLoading: false,
        error: false,
        data: [],
        total: 0
    },
    products: {},
    product: {}
}

export const GlobalStateContext = React.createContext()

const basketsInitialState = {
    isLoading: false,
    error: false,
    data: []
}

const basketReducer = (state, action) => {
    switch (action.type) {
        case 'loading': {
            return {
                ...state,
                isLoading: true
            }
        }
        case 'add_to_cart': {
            return {...state, data: [...state.data, action.payload]}
        }
        case 'set_basket': {
            return {
                ...state,
                data: [...state.data, action.payload]
            }
        }
        case 'set_baskets': {
            return {
                ...state,
                data: action.payload.baskets,
                total: action.payload.total
            }
        }
        case 'basket_error': {
            return {...state, isLoading: false, error: true}
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`)
        }
    }
}
// basket-context.js

const BasketsContext = React.createContext()
const BasketsProvider = ({children}) => {
    const api = useCommerceAPI()

    // slas hooks
    const shopper = useCustomer()
    console.log('shopper', shopper)
    // Create or restore the user session upon mounting
    useEffect(() => {
        shopper.login()
    }, [])

    const [baskets, dispatch] = React.useReducer(basketReducer, basketsInitialState)

    const value = React.useMemo(() => ({baskets, dispatch}), [baskets])

    //
    const getBasketById = (basketId) => {
        return baskets.data.find((basket) => basket.basketId === basketId)
    }

    const createBasket = async () => {
        dispatch({type: 'loading'})
        try {
            const res = await api.shopperBaskets.createBasket({})
            console.log('seting a basket====================')
            dispatch({type: 'set_basket', payload: res})
            return res
        } catch (err) {
            dispatch({type: 'error'})
            throw new Error(err)
        }
    }

    const getBaskets = async () => {
        dispatch({type: 'loading'})
        try {
            console.log('getting baskets---------------------------')

            const res = await api.shopperCustomers.getCustomerBaskets({
                parameters: {customerId: shopper?.customerId}
            })
            console.log('res', res)
            if (!res.total) {
                console.log('creating a basket ----------------------------')
                await createBasket()
            }
            console.log('setting baskets-------------------------')
            dispatch({type: 'set_baskets', payload: res})
            // console.log('res.json()', res.json())
            // const data = res.json()
        } catch (e) {
            console.log('basket error --------------------')
            console.log('e', e)
        }
    }

    // retrieve the baskets information on first render
    // if there is no basket, create one => can we delay this until someone adds an item to cart
    React.useEffect(() => {
        console.log('Initializing baskets =========================')
        console.log('baskets', baskets)
        console.log('shoppers', shopper)
        console.log('>>>>>>')

        if (!baskets.data.length && shopper.isInitialized) {
            dispatch({type: 'loading'})
            try {
                console.log('getting and setting up basket>>>>>>>>>>>>>>>>>>>>>>')
                getBaskets(shopper.customerId)
            } catch (err) {
                dispatch({type: 'error'})
                throw new Error(err)
            }
        }
    }, [shopper.authType, baskets.total])

    // handle anything related to basket here
    return <BasketsContext.Provider value={{...value}}>{children}</BasketsContext.Provider>
}

export const useBaskets = () => {
    const context = React.useContext(BasketsContext)
    if (context === undefined) {
        throw new Error(`useUser must be used within a UserProvider`)
    }
    return context
}

// put this into a module?
const addItemToCart = async (dispatch, item, basketId) => {
    const api = useCommerceAPI()
    dispatch({type: 'loading'})
    try {
        const res = await api.shopperBaskets.addItemToBasket({
            body,
            parameters: {basketId}
        })
        dispatch({type: 'add_to_cart', payload: res})
    } catch (err) {
        dispatch({type: 'error'})
        throw new Error(err)
    }
}

// usage
// const PDP = () => {
//     const {product} = useProduct(1, [])
//     const {baskets, dispatch: basketsDispatch} = useBasket()
//     const {isLoading: isBasketsLoading, error: basketsError} = baskets
//     return (
//         <div>
//             <div>{product.name}</div>
//             <div>{basketsError.toString()}</div>
//             <button
//                 disabled={isBasketsLoading}
//                 onClick={(variant, quantity) => {
//                     const basketId = baskets.data[0]
//                     // pass dispatch to aync
//                     addItemToCart(basketsDispatch, {variant, quantity}, basketId)
//                 }}
//             >
//                 Add to cart
//             </button>
//         </div>
//     )
// }

export const SCAPIProvider = (props) => {
    // TODO: Figure out a cleaner API for getting the current value for the context.

    const {scapiHooks} = getAllContexts()
    console.log('scapiHooks', scapiHooks)
    const effectsValues =
        typeof window === 'undefined'
            ? scapiHooks || initialValue
            : window.__PRELOADED_STATE__.scapiHooks

    return (
        <SCAPIContext.Provider>
            <BasketsProvider>
                <ServerEffect.Provider value={effectsValues}>
                    {props.children}
                </ServerEffect.Provider>
            </BasketsProvider>
        </SCAPIContext.Provider>
    )
}

export const useProduct = (id, source) => {
    const api = useCommerceAPI()
    const {data, isLoading, error} = useServerEffect(async () => {
        const product = await api.shopperProducts.getProduct({
            parameters: {
                id,
                allImages: true
            }
        })

        console.log('product', product)
        // if (product.id) {
        //     setHasSucceeded(true)
        // }

        return product
    }, source)

    return {
        isLoading,
        error,
        product: data
    }
}

// PRIVATE
// const getValues = () => (effectsValues)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const testProduct = {
    id: '1',
    name: 'Dress Pants'
}
