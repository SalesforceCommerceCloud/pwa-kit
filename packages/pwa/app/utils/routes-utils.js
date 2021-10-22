import {HOME_HREF} from '../constants'
import {getUrlsConfig} from './utils'
import {urlsConfigTypes} from '../constants'

/**
 * Modify the routes to add extra dynamic params to each route based on urls configuration
 * @param routes - array of routes
 */
export const routesModifier = (routes) => {
    const urlsConfig = getUrlsConfig()
    if (!urlsConfig) return routes
    if (!routes.length) return []
    return routes.map(({path, ...rest}) => {
        if (path === HOME_HREF) return {path, ...rest}
        let tempPathSegment = []

        Object.keys(urlsConfig).forEach((key) => {
            if (urlsConfig[key] === urlsConfigTypes.PATH) {
                tempPathSegment.push(`:${key}`)
            }
        })
        return {
            path: `${tempPathSegment.length ? `/${tempPathSegment.join('/')}` : ''}${path}`,
            ...rest
        }
    })
}
