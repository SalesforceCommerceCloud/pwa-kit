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

// Base component style overrides
import alert from './components/base/alert'
import accordion from './components/base/accordion'
import badge from './components/base/badge'
import button from './components/base/button'
import checkbox from './components/base/checkbox'
import container from './components/base/container'
import drawer from './components/base/drawer'
import formLabel from './components/base/formLabel'
import icon from './components/base/icon'
import input from './components/base/input'
import modal from './components/base/modal'
import radio from './components/base/radio'
import nativeSelect from './components/base/native-select'
import skeleton from './components/base/skeleton'
import tooltip from './components/base/tooltip'
import popover from './components/base/popover'
//
// // Project Component style overrides
import app from './components/project/_app'
// import Breadcrumb from './components/project/breadcrumb'
import header from './components/project/header'
// import ListMenu from './components/project/list-menu'
import footer from './components/project/footer'
import checkoutFooter from './components/project/checkout-footer'
import linkList from './components/project/links-list'
// import DrawerMenu from './components/project/drawer-menu'
// import NestedAccordion from './components/project/nested-accordion'
// import LocaleSelector from './components/project/locale-selector'
import offlineBanner from './components/project/offline-banner'
// import Pagination from './components/project/pagination'
import productTile from './components/project/product-tile'
import socialIcons from './components/project/social-icons'
import swatchGroup from './components/project/swatch-group'
// import ImageGallery from './components/project/image-gallery'

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
        recipes: {
            // Built-in components
            badge,
            button,
            container,
            formLabel,
            icon,
            input,
            modal,
            radio,
            skeleton,
            popover
        },
        slotRecipes: {
            // Built-in components
            alert,
            accordion,
            drawer,
            checkbox,
            tooltip,
            nativeSelect,

            // project components
            app,
            checkoutFooter,
            footer,
            header,
            linkList,
            offlineBanner,
            productTile,
            socialIcons,
            swatchGroup
        }
        // keep these here for reference til we finish the components
        // components: {
        //     // base components
        //     Accordion,
        //     Badge,
        //     Button,
        //     Checkbox,
        //     Container,
        //     Drawer,
        //     FormLabel,
        //     Icon,
        //     Input,
        //     Modal,
        //     Popover,
        //     Radio,
        //     Select,
        //     Skeleton,
        //     Tooltip,
        //
        //     // project components
        //     App,
        //     Breadcrumb,
        //     Header,
        //     Footer,
        //     CheckoutFooter,
        //     LinksList,
        //     ListMenu,
        //     DrawerMenu,
        //     NestedAccordion,
        //     LocaleSelector,
        //     OfflineBanner,
        //     SocialIcons,
        //     Pagination,
        //     ProductTile,
        //     SwatchGroup,
        //     ImageGallery
        // }
    }
})
const system = createSystem(defaultConfig, overrides)
export default system
