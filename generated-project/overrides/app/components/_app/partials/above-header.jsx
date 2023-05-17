/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'
import React from 'react'
const AboveHeader = () => {
    const intl = useIntl()
    return (
        <div>
            {intl.formatMessage({
                defaultMessage: 'Above Header Section',
                id: 'header.link.above_header_section'
            })}
            {intl.formatMessage({
                defaultMessage: 'Home descript features Testing',
                id: 'home.description.features'
            })}
        </div>
    )
}

export default AboveHeader
