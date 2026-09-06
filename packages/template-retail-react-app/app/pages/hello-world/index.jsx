/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Helmet} from 'react-helmet'
import {useIntl, FormattedMessage} from 'react-intl'

const HelloWorld = () => {
    const intl = useIntl()

    return (
        <Box layerStyle="page" className="hello-world" data-testid="hello-world-page">
            <Helmet>
                <title>
                    {intl.formatMessage({
                        defaultMessage: 'Hello World',
                        id: 'hello_world.title.hello_world'
                    })}
                </title>
            </Helmet>
            <Heading as="h1">
                <FormattedMessage
                    defaultMessage="Hello World"
                    id="hello_world.heading.hello_world"
                />
            </Heading>
        </Box>
    )
}

export default HelloWorld
