/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {useIntl} from 'react-intl'

// Components
import {
    Alert,
    Text,

    // Hooks
    useStyleConfig
} from '@chakra-ui/react'

// Icons
import {AlertIcon} from '../icons'

const OfflineBanner = () => {
    const intl = useIntl()
    const style = useStyleConfig('OfflineBanner')

    return (
        <Alert status="info" {...style.container}>
            <AlertIcon {...style.icon} />
            <Text {...style.message}>
                {intl.formatMessage({
                    id: 'offline_banner.message',
                    defaultMessage: "You're currently browsing in offline mode"
                })}
            </Text>
        </Alert>
    )
}

export default OfflineBanner
