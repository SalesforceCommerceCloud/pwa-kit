import React, {useEffect} from 'react'
import {
    createServerEffectContext,
    getAllContexts
} from 'pwa-kit-react-sdk/ssr/universal/server-effects'
import {ShopperBaskets, ShopperSearch} from 'commerce-sdk-isomorphic'
// NOTE: This is the important part of the API, here we get a context with a hook that will
// use that context.
const {ServerEffectProvider, useServerEffect} = createServerEffectContext('scapiHooks')
import {useCommerceAPI} from './commerce-api/contexts'
import {isError} from './commerce-api/utils'
import useCustomer from './commerce-api/hooks/useCustomer'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

const SCAPIContext = React.createContext()
const initialValue = {name: 'scapiHooks', data: {}, requests: []}

const getCommerceApiConfig = () => {
    const {app} = getConfig()
    const commerceConfig = {
        ...app.commerceAPI,
        proxy: `${getAppOrigin()}${app.commerceAPI.proxyPath}`,
        einsteinConfig: app.einsteinAPI
    }

    return commerceConfig
}

const basketShopperAPI = () => {
    const commerceConfig = getCommerceApiConfig()
    // set up
}
// basket-context.js

// const BasketsContext = React.createContext()
// const BasketsProvider = ({children}) => {
//     // TODO: we should separate api into different apis context instead of having a combined api object here
//     // for example: ShopperBasketAPI, ShopperCustomerAPI
//     const api = useCommerceAPI()
//
//     // slas hooks
//     const shopper = useCustomer()
//     // Create or restore the user session upon mounting
//     // this flow should stay in shopper hook
//     useEffect(() => {
//         shopper.login()
//     }, [])
//
//     const [baskets, dispatch] = React.useReducer(basketReducer, basketsInitialState)
//
//     const value = React.useMemo(() => ({baskets, dispatch}), [baskets])
//
//     const createBasket = async () => {
//         dispatch({type: 'loading'})
//         try {
//             const res = await api.shopperBaskets.createBasket({})
//             console.log('seting a basket====================')
//             dispatch({type: 'set_basket', payload: res})
//             return res
//         } catch (err) {
//             dispatch({type: 'error'})
//             throw new Error(err)
//         }
//     }
//
//     const getBaskets = async () => {
//         dispatch({type: 'loading'})
//         try {
//             console.log('getting baskets---------------------------')
//             console.log('api.shopperBaskets', api.shopperBaskets)
//             const res = await api.shopperCustomers.getCustomerBaskets({
//                 parameters: {customerId: shopper?.customerId}
//             })
//             console.log('res', res)
//             if (!res.total) {
//                 console.log('creating a basket ----------------------------')
//                 await createBasket()
//             }
//
//             console.log('setting baskets-------------------------')
//             dispatch({type: 'set_baskets', payload: res})
//         } catch (e) {
//             console.log('basket error --------------------')
//             console.log('e', e)
//         }
//     }
//
//     const addItemToCart = async (item, basketId) => {
//         console.log('add to cart loading ----')
//         dispatch({type: 'loading'})
//         try {
//             console.log('adding-item to cart')
//             const res = await api.shopperBaskets.addItemToBasket({
//                 body: item,
//                 parameters: {basketId}
//             })
//             console.log('res', res)
//             dispatch({type: 'add_to_cart', payload: res})
//         } catch (err) {
//             dispatch({type: 'error'})
//             throw new Error(err)
//         }
//     }
//
//     // retrieve the baskets information on first render
//     // if there is no basket, create one => can we delay this until someone adds an item to cart
//     React.useEffect(() => {
//         console.log('Initializing baskets =========================')
//         // console.log('baskets', baskets)
//         // console.log('shoppers', shopper)
//         // console.log('>>>>>>')
//
//         if (!baskets.data.length && shopper.isInitialized) {
//             dispatch({type: 'loading'})
//             try {
//                 console.log('getting and setting up basket>>>>>>>>>>>>>>>>>>>>>>')
//                 getBaskets(shopper.customerId)
//             } catch (err) {
//                 dispatch({type: 'error'})
//                 throw new Error(err)
//             }
//         }
//     }, [shopper.authType, baskets.total])
//
//     // handle anything related to basket here
//     return (
//         <BasketsContext.Provider value={{...value, addItemToCart}}>
//             {children}
//         </BasketsContext.Provider>
//     )
// }
//
// export const useBaskets = () => {
//     const context = React.useContext(BasketsContext)
//     if (context === undefined) {
//         throw new Error(`useUser must be used within a UserProvider`)
//     }
//     return context
// }

// put this into a module?
/**
 * Add an item to the basket.
 *
 * @param {function} dispatch - basket dispatch method to call an action
 * @param {array} item
 * @param {string} item.productId - The id of the product.
 * @param {number} item.quantity - The quantity of the item.
 * @param {string} basketId - basket id
 */
export const addItemToCart = async (dispatch, item, basketId, api) => {
    // const api = useCommerceAPI()
    console.log('add to cart loading ----')
    dispatch({type: 'loading'})
    try {
        console.log('adding-item to cart')
        const res = await api.shopperBaskets.addItemToBasket({
            body: item,
            parameters: {basketId}
        })
        console.log('res', res)
        dispatch({type: 'add_to_cart', payload: res})
    } catch (err) {
        dispatch({type: 'error'})
        throw new Error(err)
    }
}

export const SCAPIProvider = (props) => {
    // TODO: Figure out a cleaner API for getting the current value for the context.

    const {scapiHooks} = getAllContexts()
    console.log('scapiHooks', scapiHooks)
    const effectsValues =
        typeof window === 'undefined'
            ? scapiHooks || initialValue
            : window.__PRELOADED_STATE__.scapiHooks

    return (
        <SCAPIContext.Provider value={{}}>
            <ServerEffectProvider value={effectsValues}>{props.children}</ServerEffectProvider>
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
