import _routes from '*/app/routes'
import loadable, {LoadableComponent} from '@loadable/component'

// Make this page its own chunk.
const Account = loadable(() => import('./pages/account'))

// This is the "customizeApp" function that the runtimes create handler calls.
const routes = [
    {
        path: '/account',
        exact: true,
        // Type assertion because otherwise we encounter this error:
        // Exported variable 'routes' has or is using name 'Props' from external module "./app/pages/home" but cannot be named.
        component: Account as LoadableComponent<unknown>
    },
    ..._routes
]

export default routes