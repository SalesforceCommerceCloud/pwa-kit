import {type RouteConfig, index, route} from '@react-router/dev/routes'

export default [
    index('routes/home/index.tsx'),
    route('search', 'routes/search/index.tsx'),
    route('category/:categoryId', 'routes/category/index.tsx'),
    route('product/:productId', 'routes/product/index.tsx'),
    route('cart', 'routes/cart/index.tsx'),
    route('about', 'routes/about/index.tsx')
] satisfies RouteConfig
