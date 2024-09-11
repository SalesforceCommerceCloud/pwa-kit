/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// pwa-kit-* packages currently do not export any type definitions, which causes the TypeScript
// compiler to report errors when the packages are used. Until the packages provide their own
// definitions, this file serves to mitigate the errors by typing the packages' exports as `any`.
declare module '@salesforce/pwa-kit-react-sdk/ssr/browser/main'
declare module '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
declare module '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
declare module '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
