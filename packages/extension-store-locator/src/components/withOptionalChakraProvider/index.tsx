/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import { useTheme, Theme, ChakraProvider } from '@chakra-ui/react';

type WithOptionalChakra = React.ComponentPropsWithoutRef<any>


/**
 * Higher-order component that conditionally wraps a given component with ChakraProvider.
 * 
 * @param WrappedComponent - The component to be optionally wrapped with ChakraProvider.
 * @param theme - Optional Chakra UI theme to be used
 * @returns A component that wraps the given component with ChakraProvider if it is not already present in the component tree.
 */
const withOptionalChakra = <P extends {}>(
  WrappedComponent: React.ComponentType<P>,
  theme?: Theme
) => {
  const WithOptionalChakra: React.FC<P> = (props: WithOptionalChakra) => {
    const chakraTheme = useTheme();

    // @TODO: Is there a better way to determine if ChakraProvider is already in the tree?
    const hasChakraProvider = chakraTheme && Object.keys(chakraTheme || {}).length > 0;

    return !hasChakraProvider ? (
      <ChakraProvider theme={theme}>
        <WrappedComponent {...(props as P)} />
      </ChakraProvider>
    ) : <WrappedComponent {...(props as P)} />
  }

  return WithOptionalChakra
}

export default withOptionalChakra