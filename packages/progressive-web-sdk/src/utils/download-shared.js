/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// Values shared between the service-worker and client code of the
// DownloadManager and DownloadTracker.

// Priority constants
export const HIGH = 'high'
export const NORMAL = 'normal'
export const LOW = 'low'
export const UNTHROTTLED = 'unthrottled'

// Message constants
export const CONFIGURE_THROTTLING = 'configureThrottling'
export const CONFIGURED_THROTTLING = 'configuredThrottling'
export const NETWORK_BUSY_STATUS = 'networkBusyStatus'

// Event type constants
export const downloadCompleteEvent = 'downloadComplete'
export const downloadStartedEvent = 'downloadStarted'
export const downloadThrottledEvent = 'downloadThrottled'

// Other constants
export const X_PWA_PRIORITY = 'x-pwa-priority'
