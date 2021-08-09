/* global DEBUG */
import {AnalyticsManager} from 'pwa-kit-react-sdk/dist/analytics-integrations/analytics-manager'
export const getAnalyticsManager = (() => {
    let instance = null
    return () => {
        if (instance !== null) return instance

        return (instance = new AnalyticsManager({
            connectors: [],
            debug: DEBUG
        }))
    }
})()
