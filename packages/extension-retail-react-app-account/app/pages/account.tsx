/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

interface Props {
    value: number
}

const Account = ({value}: Props) => {
    return (
        <div>
            <h1>Account</h1>
            <p>This page was provided by the `extension-retail-react-app-account` package.</p>
        </div>
    )
}

Account.getTemplateName = () => 'account'

export default Account
