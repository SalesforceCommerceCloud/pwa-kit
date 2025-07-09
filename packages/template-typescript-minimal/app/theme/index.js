/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createSystem, defaultConfig, defineConfig} from '@chakra-ui/react'

// Foundational style overrides
import styles from './foundations/styles'
import colors from './foundations/colors'
import gradients from './foundations/gradients'
import sizes from './foundations/sizes'
import layerStyles from './foundations/layerStyles'
import shadows from './foundations/shadows'

// Please refer to the Chakra-Ui theme customization docs found
// here https://chakra-ui.com/docs/theming/customize-theme to learn
// more about extending and overriding themes for your project.

export const breakpoints = {
    base: '0em',
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em'
}

export const overrides = defineConfig({
    ...styles,
    theme: {
        layerStyles,
        tokens: {
            colors,
            sizes,
            gradients,
            shadows,
            fonts: {
                heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
                body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
                mono: `SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace`
            },
            breakpoints
        },
        semanticTokens: {
            shadows
        },
    }
})
const system = createSystem(defaultConfig, overrides)
export default system
