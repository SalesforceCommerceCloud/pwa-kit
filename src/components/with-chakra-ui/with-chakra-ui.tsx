/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {ChakraProvider} from '@chakra-ui/react'
import Toaster, {toaster} from '../toaster'

// Local
import theme from '../../theme'

// Define a type for the HOC props
type WithChakraUIProps = React.ComponentPropsWithoutRef<any>

// Define the HOC function
const withChakraUI = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithChakraUI: React.FC<P> = (props: WithChakraUIProps) => {
        return (
            <ChakraProvider value={theme}>
                <WrappedComponent {...(props as P)} />
                <Toaster toaster={toaster} />
            </ChakraProvider>
        )
    }

    return WithChakraUI
}

export default withChakraUI
