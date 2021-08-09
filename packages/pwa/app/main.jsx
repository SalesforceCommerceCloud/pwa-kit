import {start, registerServiceWorker} from 'pwa-kit-react-sdk/dist/ssr/browser/main'
import {getAnalyticsManager} from './analytics'

const main = () => {
    return Promise.all([start(), getAnalyticsManager(), registerServiceWorker('/worker.js')])
}

main()
