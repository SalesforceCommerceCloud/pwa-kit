/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

/**
 * Simple higher-order component used to conditionally render a placeholder component, whilst data
 * is fetched via the provided hook.
 *
 * @param {*} Component
 * @param {*} opts
 * @returns
 */
const withCommerceData = (Component, opts = {}) => {
    const WrappedComponent = ({...props}) => {
        const {hook, queryOption, ComponentPlaceholder = () => {}} = opts
        const {data, isLoading} = hook(
            typeof queryOption === 'function' ? queryOption(props) : queryOption
        )

        return isLoading ? <ComponentPlaceholder /> : <Component {...props} data={data} />
    }

    WrappedComponent.propTypes = {}

    return WrappedComponent
}

export default withCommerceData
