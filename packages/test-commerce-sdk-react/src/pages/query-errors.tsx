/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useProducts, useProduct} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'

const QueryErrors = () => {
    // TODO: `products` is a contrived situation, as the query hook is disabled by default until all
    // required parameters have been set. Also, unused parameters (like `FOO`) are simply ignored.
    // Do we still want to highlight this error?

    // Type assertion because we're explicitly violating the expected type
    const products = useProducts({parameters: {FOO: ''}} as any, {enabled: true})
    const product = useProduct({parameters: {id: '25502228Mxxx'}})
    /** Errors don't nicely serialize to JSON, so we have to do it ourselves. */
    const toLoggable = (err: unknown) => {
        if (err instanceof Error) {
            // Clone all keys onto a plain object
            const keys = Object.getOwnPropertyNames(err) as Array<keyof Error>
            return keys.reduce((acc, key) => ({...acc, [key]: err[key]}), {})
        }
        return err
    }

    return (
        <>
            <h1>Query Errors</h1>

            <p>
                Two common errors you&apos;ll find when using the{' '}
                <code>commerce-sdk-isomorphic</code> library are:
            </p>
            <ul>
                <li>
                    <strong>Validation error</strong> (e.g. when you pass in the wrong arguments to
                    the function call)
                </li>
                <li>
                    <strong>Response error</strong> (e.g. 4xx and 5xx http errors from the
                    underlying Commerce API)
                </li>
            </ul>

            <h2>Validation Error</h2>
            {products.isLoading && <p style={{background: 'aqua'}}>Loading...</p>}
            {products.error && <p style={{color: 'red'}}>Something is wrong.</p>}

            <div>
                <div>Returning data:</div>
                <Json
                    data={{
                        isLoading: products.isLoading,
                        error: toLoggable(products.error),
                        data: products.data
                    }}
                />
            </div>

            <h2>Response Error</h2>
            {product.isLoading && <p style={{background: 'aqua'}}>Loading...</p>}
            {product.error && <p style={{color: 'red'}}>Something is wrong.</p>}

            <div>
                <div>Returning data:</div>
                <Json
                    data={{
                        isLoading: product.isLoading,
                        error: toLoggable(product.error),
                        data: product.data
                    }}
                />
            </div>
        </>
    )
}

QueryErrors.getTemplateName = () => 'QueryErrors'

export default QueryErrors
