/* global AJS_SLUG, DEBUG */
import {AnalyticsManager} from 'progressive-web-sdk/dist/analytics-integrations/analytics-manager'
import {EngagementEngineConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/engagement-engine'
export const getAnalyticsManager = (() => {
    let instance = null
    return () => {
        if (instance !== null) return instance

        return (instance = new AnalyticsManager({
            connectors: [
                new EngagementEngineConnector({
                    projectSlug: AJS_SLUG
                })
            ],
            debug: DEBUG
        }))
    }
})()
