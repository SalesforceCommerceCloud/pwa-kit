/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// OVERRIDE!! This border is now BLUE.....

// Define the HOC function
const withRedBorder = (WrappedComponent) => {
    const WithRedBorder = (props) => {
        return (
            <div style={{ border: '2px solid blue', padding: '10px' }}>
                <WrappedComponent {...(props)} />
            </div>
        )
    }

    return WithRedBorder
}

export default withRedBorder