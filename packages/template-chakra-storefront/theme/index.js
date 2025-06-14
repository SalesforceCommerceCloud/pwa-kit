/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { createSystem, defaultConfig } from '@chakra-ui/react'

// Foundational style overrides
import styles from './foundations/styles'
import colors from './foundations/colors' // Will be the refactored colors
import gradients from './foundations/gradients'
import sizes from './foundations/sizes'
import space from './foundations/space'
import layerStyles from './foundations/layerStyles'
import shadows from './foundations/shadows'
// Font tokens would be defined here if they existed in a separate file like fonts.js
// For example: import fonts from './foundations/fonts'

// Base component style overrides
import Alert from './components/base/alert'
import Accordion from './components/base/accordion'
import Badge from './components/base/badge'
import Button from './components/base/button'
import Checkbox from './components/base/checkbox'
import Container from './components/base/container'
import Drawer from './components/base/drawer'
import FormLabel from './components/base/formLabel'
import Icon from './components/base/icon'
import Input from './components/base/input'
import Modal from './components/base/modal' // This will need to be mapped to Dialog later
import Radio from './components/base/radio'
import Select from './components/base/select'
import Skeleton from './components/base/skeleton'
import Tooltip from './components/base/tooltip'
import Popover from './components/base/popover'

// Project Component style overrides
import App from './components/project/_app'
import Breadcrumb from './components/project/breadcrumb'
import Header from './components/project/header'
import ListMenu from './components/project/list-menu'
import Footer from './components/project/footer'
import CheckoutFooter from './components/project/checkout-footer'
import LinksList from './components/project/links-list'
import DrawerMenu from './components/project/drawer-menu'
import NestedAccordion from './components/project/nested-accordion'
import LocaleSelector from './components/project/locale-selector'
import OfflineBanner from './components/project/offline-banner'
import Pagination from './components/project/pagination'
import ProductTile from './components/project/product-tile'
import SocialIcons from './components/project/social-icons'
import SwatchGroup from './components/project/swatch-group'
import ImageGallery from './components/project/image-gallery'

// Define font tokens if not already in styles.js or if they need to be centralized
// Example:
const fontTokens = {
  // heading: { value: `'Figtree', sans-serif` }, // Replace with actual fonts if specified
  // body: { value: `'Figtree', sans-serif` }, // Replace with actual fonts if specified
}

// Gather all component styles
const componentOverrides = {
    // base components
    Accordion,
    Alert,
    Badge,
    Button,
    Checkbox,
    Container,
    Drawer,
    FormLabel,
    Icon,
    Input,
    Modal, // Will map to Dialog styling
    Popover,
    Radio,
    Select,
    Skeleton,
    Tooltip,

    // project components
    App,
    Breadcrumb,
    Header,
    Footer,
    CheckoutFooter,
    LinksList,
    ListMenu,
    DrawerMenu,
    NestedAccordion,
    LocaleSelector,
    OfflineBanner,
    SocialIcons,
    Pagination,
    ProductTile,
    SwatchGroup,
    ImageGallery
}

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: colors, // from ./foundations/colors.js
      // fonts: fontTokens, // Add if fonts are defined
      sizes: sizes, // from ./foundations/sizes.js
      space: space, // from ./foundations/space.js
      shadows: shadows, // from ./foundations/shadows.js
      // gradients are not a direct token type, they are usually used in layerStyles or component styles.
      // If 'gradients.js' exports token-like values, they need to be structured appropriately.
      // For now, assuming gradients are used within styles/components.
    },
    semanticTokens: {
      colors: {
        // Example, will need to be filled if colorPalette="brand" is used
        // brand: {
        //   solid: { value: "{colors.brand.500}" },
        //   contrast: { value: "{colors.brand.100}" },
        //   // ... and other semantic tokens
        // },
      },
    },
    layerStyles: layerStyles, // from ./foundations/layerStyles.js
    styles: { // Global styles
        global: styles.global // from ./foundations/styles.js global export
    },
    components: componentOverrides
  }
  // preflight: false, // if resetCss prop was false on ChakraProvider
  // Other createSystem options if needed
})

export default system
