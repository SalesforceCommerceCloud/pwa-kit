import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@chakra-ui/react'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import theme from '../../theme'
import CommerceAPI from '../../commerce-api'
import {CommerceAPIProvider, CustomerProvider, BasketProvider} from '../../commerce-api/utils'
import {commerceAPIConfig} from '../../commerce-api.config'

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */
const AppConfig = (props) => {
    const [basket, setBasket] = useState(null)
    const [customer, setCustomer] = useState(null)

    return (
        <CommerceAPIProvider value={AppConfig.api}>
            <CustomerProvider value={{customer, setCustomer}}>
                <BasketProvider value={{basket, setBasket}}>
                    <ChakraProvider theme={theme}>{props.children}</ChakraProvider>
                </BasketProvider>
            </CustomerProvider>
        </CommerceAPIProvider>
    )
}

AppConfig.restore = () => {
    AppConfig.api = new CommerceAPI(commerceAPIConfig)
}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = () => {
    AppConfig.api = new CommerceAPI(commerceAPIConfig)

    return {
        api: AppConfig.api
    }
}

AppConfig.propTypes = {
    children: PropTypes.node
}

export default AppConfig
