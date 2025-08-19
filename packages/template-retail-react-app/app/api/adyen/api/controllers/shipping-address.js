/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBaskets} from 'commerce-sdk-isomorphic'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'

async function updateShippingAddress(req, res, next) {
    Logger.info('updateShippingAddress', 'start')

    try {
        const {app: appConfig} = getConfig()
        const shopperBaskets = new ShopperBaskets({
            ...appConfig.commerceAPI,
            headers: {authorization: req.headers.authorization}
        })

        const {data} = req.body

        const basket = await shopperBaskets.updateShippingAddressForShipment({
            body: {
                address1: data.deliveryAddress.street,
                city: data.deliveryAddress.city,
                countryCode: data.deliveryAddress.country,
                postalCode: data.deliveryAddress.postalCode,
                stateCode: data.deliveryAddress.stateOrProvince,
                firstName: data.profile.firstName,
                fullName: `${data.profile.firstName} ${data.profile.lastName}`,
                lastName: data.profile.lastName,
                phone: data.profile.phone
            },
            parameters: {
                basketId: req.headers.basketid,
                shipmentId: 'me'
            }
        })

        Logger.info('updateShippingAddress', 'success')
        res.locals.response = basket
        next()
    } catch (err) {
        Logger.error('updateShippingAddress', JSON.stringify(err))
        next(err)
    }
}

export default updateShippingAddress
