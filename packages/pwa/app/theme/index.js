import {extendTheme} from '@chakra-ui/react'

// Foundational style overrides
import styles from './foundations/styles'
import colors from './foundations/colors'
import gradients from './foundations/gradients'
import sizes from './foundations/sizes'
import space from './foundations/space'
import layerStyles from './foundations/layerStyles'

// Base component style overrides
import Accordion from './components/base/accordion'
import Badge from './components/base/badge'
import Button from './components/base/button'
import Checkbox from './components/base/checkbox'
import Container from './components/base/container'
import Drawer from './components/base/drawer'
import FormLabel from './components/base/formLabel'
import Icon from './components/base/icon'
import Input from './components/base/input'
import Radio from './components/base/radio'
import Select from './components/base/select'
import Skeleton from './components/base/skeleton'
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

// Project Pages
import ProductList from './components/project/product-list-page'

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
    components: {
        // base components
        Accordion,
        Badge,
        Button,
        Checkbox,
        Container,
        Drawer,
        FormLabel,
        Icon,
        Input,
        Popover,
        Radio,
        Select,
        Skeleton,

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
        Pagination,
        ProductTile,
        SocialIcons,

        // pages
        ProductList
    }
}

export default extendTheme(overrides)
