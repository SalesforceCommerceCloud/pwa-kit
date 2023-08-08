/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {extendTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import theme from '@salesforce/retail-react-app/app/theme/index'
import ProductTile from '../../../theme/components/product-tile'

// TODO: update generator to generate this theme override

// Please refer to the Chakra-Ui theme customization docs found
// here https://chakra-ui.com/docs/theming/customize-theme to learn
// more about extending and overriding themes for your project.
const overrides = {
    components: {
        ProductTile
    }
}

// NOTE: this file overrides the `theme/index.js` file in the base template,
// but relying on Chakra's `extendTheme` to do the majority of the work.
export default extendTheme(theme, overrides)
