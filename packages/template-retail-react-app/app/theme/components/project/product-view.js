import {ProductView} from 'pwa-kit-ecom/theme/components'

export default {
    ...ProductView,
    baseStyle: {
        ...ProductView.baseStyle,
        container: {
            ...ProductView.baseStyle.container,
            background: 'yellow.100'
        }
    }
}
