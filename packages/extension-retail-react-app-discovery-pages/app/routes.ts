// import _routes from '*/app/routes'
import loadable, {LoadableComponent} from '@loadable/component'

// Make this page its own chunk.
const Home = loadable(() => import('*/pages/home'))
const ProductDetail = loadable(() => import('*/pages/product-detail'))
const ProductList = loadable(() => import('*/pages/product-list'))

// This is the "customizeApp" function that the runtimes create handler calls.
const routes = [
    // ..._routes,
    {
        path: '/home',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: Home as LoadableComponent<unknown>
    },
    {
        path: '/product-detail',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: ProductDetail as LoadableComponent<unknown>
    },
    {
        path: '/product-list',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: ProductList as LoadableComponent<unknown>
    }
]

export default routes