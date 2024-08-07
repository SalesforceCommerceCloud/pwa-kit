// import loadable from '@loadable/component'
// const StoreFinderPage = loadable(() => import('/Users/bchypak/Projects/pwa-kit/packages/extension-store-finder/pages/store-finder-page'))
import StoreFinderPage from '/Users/bchypak/Projects/pwa-kit/packages/extension-store-finder/pages/store-finder-page'

export default (App) => {
    App.initialRoutes = [
        {
            exact: true,
            path: '/store-finder-page',
            component: StoreFinderPage
        },
        ...(App.initialRoutes || [])
    ]
}
