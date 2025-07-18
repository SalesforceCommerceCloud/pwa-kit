/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useSlotRecipe, useToken} from '@chakra-ui/react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Custom hook for managing app configuration and theme settings
 * Handles app config retrieval and theme color extraction
 *
 * @returns {Object} App configuration and theme data
 */
export const useAppConfig = () => {
    const appConfig = getConfig()

    // Apply styles from the theme
    const recipe = useSlotRecipe({key: 'app'})
    const styles = recipe()

    // https://www.chakra-ui.com/docs/theming/overview#tokens-1
    const [themeColor] = useToken('colors.blue', '600')

    return {
        appConfig,
        styles,
        themeColor
    }
}
