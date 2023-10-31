/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'

// Components
import {
    Alert,
    Text,

    // Hooks
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Icons
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'

const OfflineBanner = () => {
    const intl = useIntl()
    const style = useStyleConfig('OfflineBanner')

    return (
        <Alert status="info" {...style.container}>
            <AlertIcon {...style.icon} />
            <Text {...style.message}>
                {intl.formatMessage({
                    id: 'offline_banner.description.browsing_offline_mode',
                    defaultMessage: "You're currently browsing in offline mode"
                })}
            </Text>
        </Alert>
    )
}

export default OfflineBanner
