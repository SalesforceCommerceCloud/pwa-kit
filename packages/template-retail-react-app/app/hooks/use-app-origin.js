/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Custom hook to retrieve the app's origin.
 * This hook wraps the `useOrigin` hook from the `@salesforce/pwa-kit-react-sdk/ssr/universal/hooks` package.
 * when fromXForwardedHeader: false, the x-forwarded-* headers will not be considered for app origin
 * when fromXForwardedHeader: true, the x-forwarded-* headers will be considered for app origin
 */
import {useOrigin} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'

export const useAppOrigin = () => useOrigin({fromXForwardedHeader: false})
