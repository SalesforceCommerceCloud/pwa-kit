/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {extendTheme} from '@chakra-ui/react'

// Foundational style overrides
import styles from './foundations/styles'
import colors from './foundations/colors'
import gradients from './foundations/gradients'
import sizes from './foundations/sizes'
import space from './foundations/space'
import layerStyles from './foundations/layerStyles'
import shadows from './foundations/shadows'
import * as components from '../theme/components'

// Please refer to the Chakra-Ui theme customization docs found
// here https://chakra-ui.com/docs/theming/customize-theme to learn
// more about extending and overriding themes for your project.
const overrides = {
    styles,
    layerStyles,
    colors,
    sizes,
    space,
    gradients,
    shadows,
    components
}

export default extendTheme(overrides)
