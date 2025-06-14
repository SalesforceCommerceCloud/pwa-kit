import { ColorModeManagerProvider } from "../../../contexts/color-mode";
/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import { ChakraProvider as ActualChakraProvider } from '@chakra-ui/react'



/**
 * Custom Provider component for Chakra UI v3.
 * This wraps the main ChakraProvider and will be extended to handle color mode.
 * @param {object} props
 * @param {object} props.value - The theme system configuration.
 * @param {React.ReactNode} props.children - The children to render.
 */
export function Provider({ value, children }) {
  return (
    <ActualChakraProvider value={value}>
      <ColorModeManagerProvider>
        {children}
      </ColorModeManagerProvider>
      </ActualChakraProvider>
  )
}

// PropTypes for the Provider component
Provider.propTypes = {
    value: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired
}

export default Provider
