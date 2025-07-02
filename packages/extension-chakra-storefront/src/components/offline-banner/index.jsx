/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'

// Components
import {Alert, Flex} from '@chakra-ui/react'

// Icons
import {AlertIcon} from '../../components/icons'

/**
 * A banner component that displays when the user is offline.
 */
const OfflineBanner = ({...props}) => {
    const intl = useIntl()
    return (
        <Alert.Root status="warning" colorPalette="blue" {...props}>
            <Flex align="center">
                <AlertIcon mr={2} />
                <Alert.Title>
                    {intl.formatMessage({
                        id: 'offline_banner.description.browsing_offline_mode',
                        defaultMessage: "You're currently browsing in offline mode"
                    })}
                </Alert.Title>
            </Flex>
        </Alert.Root>
    )
}

export default OfflineBanner
