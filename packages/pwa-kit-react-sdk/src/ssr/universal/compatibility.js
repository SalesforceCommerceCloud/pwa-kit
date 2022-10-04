/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import AppConfig from './components/_app-config'
import {withLegacyGetProps} from './components/with-legacy-get-props'

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
