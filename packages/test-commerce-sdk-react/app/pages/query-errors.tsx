/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useProducts, useProduct} from 'commerce-sdk-react-preview'
import Json from '../components/Json'

const QueryErrors = () => {
    // @ts-ignore
    const products = useProducts({FOO: ''})
    const product = useProduct({id: '25502228Mxxx'})

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
            {products.error && <p style={{color: 'red'}}>Something is wrong</p>}

            <div>
                <div>Returning data</div>
                <Json
                    data={{
                        isLoading: products.isLoading,
                        error: products.error,
                        data: products.data
                    }}
                />
            </div>

            <h2>Response Error</h2>
            {product.isLoading && <p style={{background: 'aqua'}}>Loading...</p>}
            {product.error && <p style={{color: 'red'}}>Something is wrong</p>}

            <div>
                <div>Returning data</div>
                <Json
                    data={{
                        isLoading: product.isLoading,
                        error: product.error,
                        data: product.data
                    }}
                />
            </div>
        </>
    )
}

QueryErrors.getTemplateName = () => 'QueryErrors'

export default QueryErrors
