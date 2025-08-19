import {type RouteConfig, index, route} from '@react-router/dev/routes'

export default [
    index('routes/home/index.tsx'),
    route('search', 'routes/search/index.tsx'),
    route('category/:categoryId', 'routes/category/index.tsx'),
    route('product/:productId', 'routes/product/index.tsx'),
    route('product/add-to-cart', 'routes/product/add-to-cart.tsx'),
    route('product/add-set-to-cart', 'routes/product/add-set-to-cart.tsx'),
    route('product/add-bundle-to-cart', 'routes/product/add-bundle-to-cart.tsx'),
    route('cart', 'routes/cart/index.tsx'),
    route('about', 'routes/about/index.tsx')
] satisfies RouteConfig
