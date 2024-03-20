import _routes from '_/app/routes'
// import _routes from '@salesforce/extension-retail-react-app-storefinder/app/routes'

import loadable, {LoadableComponent} from '@loadable/component'

// Make this page its own chunk.
const StoreFinder = loadable(() => import('./pages/store-finder'))

// This is the "customizeApp" function that the runtimes create handler calls.
const routes = [
    ..._routes,
    {
        path: '/store-finder',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: StoreFinder as LoadableComponent<unknown>
    }
]

export default routes