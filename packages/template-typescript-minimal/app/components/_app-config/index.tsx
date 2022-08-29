/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment, ReactElement, ReactNode} from 'react'
interface AppConfigProps {
    children: ReactNode
}

const AppConfig = (props: AppConfigProps): ReactElement => {
    return <Fragment>{props.children}</Fragment>
}

AppConfig.restore = () => {}
AppConfig.extraGetPropsArgs = () => {}
AppConfig.freeze = () => {}

export default AppConfig
