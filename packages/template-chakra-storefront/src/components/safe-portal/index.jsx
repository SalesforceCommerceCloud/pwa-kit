/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {Portal} from '@chakra-ui/react'

/**
 * A safe version of Portal that only renders on the client side.
 * This prevents SSR issues where Portal tries to access the DOM during server rendering.
 * (Portal would call Ark UI's useEnvironmentContext hook, which tries to access `document` that doesn't exist on the server)
 *
 * @param {Object} props - Props to pass to the Portal component
 * @returns {React.Element|null} Portal component or null if on server
 */
export const SafePortal = (props) => {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        // This effect only runs on the client side
        // And with it, we avoid any hydration mismatch error
        setIsClient(true)
    }, [])

    // Don't render anything on the server or before hydration
    if (!isClient) {
        return null
    }

    return <Portal {...props} />
}

export default SafePortal
