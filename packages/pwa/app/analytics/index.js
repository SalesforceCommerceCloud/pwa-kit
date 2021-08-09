/* global AJS_SLUG, DEBUG, WEBPACK_MOBIFY_GA_ID */
import {AnalyticsManager} from 'progressive-web-sdk/dist/analytics-integrations/analytics-manager'
import {EngagementEngineConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/engagement-engine'
import {MobifyGoogleAnalyticsConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/mobify-ga'

export const getAnalyticsManager = (() => {
    let instance = null
    return () => {
        if (instance === null) {
            instance = new AnalyticsManager({
                connectors: [
                    new EngagementEngineConnector({
                        projectSlug: AJS_SLUG
                    }),
                    new MobifyGoogleAnalyticsConnector({
                        trackerId: WEBPACK_MOBIFY_GA_ID,
                        ecommerceLibrary: 'ec'
                    })
                ],
                debug: DEBUG
            })
        }
        return instance
    }
})()
