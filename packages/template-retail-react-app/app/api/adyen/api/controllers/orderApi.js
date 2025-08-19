/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fetch from 'node-fetch'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'

export class OrderApiClient {
    tokenUrl =
        'https://account.demandware.com/dwsso/oauth2/access_token?grant_type=client_credentials'

    async getAdminAuthToken() {
        const base64data = Buffer.from(
            `${process.env.COMMERCE_API_CLIENT_ID_PRIVATE}:${process.env.COMMERCE_API_CLIENT_SECRET}`
        ).toString('base64')
        const token = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                authorization: `Basic ${base64data}`
            },
            body: new URLSearchParams({
                scope: `SALESFORCE_COMMERCE_API:${process.env.SFCC_REALM_ID}_${process.env.SFCC_INSTANCE_ID} ${process.env.SFCC_OAUTH_SCOPES}`
            })
        })
        if (!token.ok) {
            const error = await token.text()
            throw new Error(`${token.status} ${token.statusText}`, {
                cause: error
            })
        }
        return token.json()
    }

    async base(method, path, options) {
        const token = await this.getAdminAuthToken()
        const baseUrl = `https://${process.env.COMMERCE_API_SHORT_CODE}.api.commercecloud.salesforce.com/checkout/orders/v1/organizations/${process.env.COMMERCE_API_ORG_ID}/orders/${path}?siteId=${process.env.COMMERCE_API_SITE_ID}`

        return fetch(baseUrl, {
            method: method,
            body: options?.body || null,
            headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${token.access_token}`,
                ...options?.headers
            }
        })
    }

    async getOrder(orderNo) {
        const response = await this.base('GET', orderNo)
        if (!response.ok) {
            const error = await response.text()
            throw new Error(`${response.status} ${response.statusText}`, {
                cause: error
            })
        }
        return await response.json()
    }

    async updateOrderStatus(orderNo, status) {
        const response = await this.base('PUT', `${orderNo}/status`, {
            body: JSON.stringify({status: status})
        })
        if (!response.ok) {
            const error = await response.text()
            throw new Error(`${response.status} ${response.statusText}`, {
                cause: error
            })
        }
        return response
    }

    async updateOrderPaymentStatus(orderNo, status) {
        const response = await this.base('PUT', `${orderNo}/payment-status`, {
            body: JSON.stringify({status: status})
        })
        if (!response.ok) {
            const error = await response.text()
            throw new Error(`${response.status} ${response.statusText}`, {
                cause: error
            })
        }
        return response
    }

    async updateOrderExportStatus(orderNo, status) {
        const response = await this.base('PUT', `${orderNo}/export-status`, {
            body: JSON.stringify({status: status})
        })
        if (!response.ok) {
            const error = await response.text()
            throw new Error(`${response.status} ${response.statusText}`, {
                cause: error
            })
        }
        return response
    }

    async updateOrderConfirmationStatus(orderNo, status) {
        const response = await this.base('PUT', `${orderNo}/confirmation-status`, {
            body: JSON.stringify({status: status})
        })
        if (!response.ok) {
            const error = await response.text()
            throw new Error(`${response.status} ${response.statusText}`, {
                cause: error
            })
        }
        return response
    }

    async updateOrderPaymentTransaction(orderNo, paymentInstrumentId, pspReference) {
        const response = await this.base(
            'PATCH',
            `${orderNo}/payment-instruments/${paymentInstrumentId}/transaction`,
            {
                body: JSON.stringify({
                    c_externalReferenceCode: pspReference
                })
            }
        )
        if (!response.ok) {
            const error = await response.text()
            Logger.error(`Payment transaction update failed ${JSON.stringify(error)}`)
        }
        return response
    }
}
