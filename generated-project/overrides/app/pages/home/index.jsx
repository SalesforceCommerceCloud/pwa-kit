/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'

function Index() {
    const intl = useIntl()
    return (
        <div>
            <div>Modified home page Modified home page</div>
            {intl.formatMessage({
                defaultMessage: 'Features',
                id: 'home.some_thing_test'
            })}
        </div>
    )
}

export default Index
