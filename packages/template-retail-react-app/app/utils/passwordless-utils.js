/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Redirect the current window to the Auth URL configured in SLAS
 *
 * @param {String} proxy
 * @param {String} idp
 * @param {String} codeChallenge
 * @param {String} slasCallbackEndpoint
 * @param {String} clientId
 * @param {String} siteId
 * @param {String} organizationId
 */
export const redirectToAuthURL = (
    proxy,
    callback_uri,
    siteId,
    mode,
    user_id,
    organizationId,
    clientId,
    clientSecret
) => {

    const encodedAuth = btoa(`${clientId}:${clientSecret}`)
    const urlEncodedBody = new URLSearchParams({
        callback_uri: callback_uri,
        channel_id: siteId,
        mode: mode,
        user_id: user_id
    })


    const url = `${proxy}/shopper/auth/v1/organizations/${organizationId}/oauth2/passwordless/login`

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encodedAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlEncodedBody.toString()
    })
    .then(response => {
        console.log(response.text())
    })
    .then(data => {
        console.log('Success: ', data)
    })
    .catch(error => console.error('Error: ', error))
}