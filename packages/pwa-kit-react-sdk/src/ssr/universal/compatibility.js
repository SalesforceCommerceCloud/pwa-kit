import AppConfig from './components/_app-config'
import {withLegacyGetProps} from './withLegacyGetProps'

let _appConfig = AppConfig

/**
 * If a user hasn't opted into a fetchStrategy, automatically
 * opt them into getProps – this maintains backward compatibility.
 *
 * @private
 */
export const getAppConfig = () => {
    if (!_appConfig.initAppState) {
        _appConfig = withLegacyGetProps(_appConfig)
    }
    return _appConfig
}