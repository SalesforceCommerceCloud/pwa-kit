/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

import {SCAPIProvider} from '../../scapi-hooks'

const AppConfig = ({children}) => {
    return <SCAPIProvider>{children}</SCAPIProvider>
}

AppConfig.restore = () => {}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = () => {}

AppConfig.propTypes = {
    children: PropTypes.node
}

export default AppConfig
