/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

/**
 * Higher-order component used to conditionally render a provided component, while data is fetched using
 * a `commerce-sdk-react` hook
 *
 * @param {Component} Component - the component you want to be conditionally rendered and provided data to.
 * @param {Object} opts.hook - a commercerce react sdk hook used to fetch data with.
 * @param {Object} opts.queryOptions - query parameters passed to the hook, optionally can be a function that returns
 * a query parameter object.
 * @param {Object} opts.placeholderContent - the component you want be rendered while data is being fetched
 * @returns {Component} - the enhanced component.
 */
const withCommerceSdkReact = (Component, opts = {}) => {
    const WrappedComponent = (props) => {
        const {hook, queryOptions, placeholder: Placeholder} = opts
        const {data, isLoading} = hook(
            typeof queryOptions === 'function' ? queryOptions(props) : queryOptions || {}
        )

        return isLoading ? <Placeholder {...props} /> : <Component {...props} data={data} />
    }

    WrappedComponent.propTypes = {}

    return WrappedComponent
}

export {withCommerceSdkReact}
