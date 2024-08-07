// import loadable from '@loadable/component'
// const SamplePage = loadable(() => import('/Users/bchypak/Projects/pwa-kit/packages/sample-extension/pages/sample-page'))
import SamplePage from '/Users/bchypak/Projects/pwa-kit/packages/extension-sample/pages/sample-page'

export default (App) => {
    App.initialRoutes = [
        {
            exact: true,
            path: '/sample-page',
            component: SamplePage
        },
        ...(App.initialRoutes || [])
    ]
}


