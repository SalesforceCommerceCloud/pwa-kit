/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/withLegacyGetProps'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/withReactQuery'
import AppConfig from 'pwa-kit-react-sdk/ssr/universal/components/_app-config'

export default withReactQuery(withLegacyGetProps(AppConfig))
