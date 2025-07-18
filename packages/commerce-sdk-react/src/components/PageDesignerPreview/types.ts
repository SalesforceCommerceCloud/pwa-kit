/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export interface PageDesignerPreviewContext {
    effectiveDateTime?: string | null
    sourceCode?: string
    customerGroupIds?: string[]
    customQualifiers?: Record<string, string>
    device?: string
}

export interface PageDesignerPreviewDevice {
    id: string
    name: string
    minWidth?: number
    maxWidth?: number
    iconName: string
}

export interface PageDesignerPreviewConfiguration {
    editUrl: string
    previewUrl: string
    previewDevices: PageDesignerPreviewDevice[]
    writableLocaleIds: string[]
    moduleWritable: boolean
    pageDesignerListGridV2FeatureToggle: boolean
    storefrontInfoUrl: string
    sfCmsChannelId?: string
    sfCmsChannelName?: string
    sfCmsError?: string
}

export interface PageDesignerPreviewMessage {
    type: string
    source: string
    payload?: any
}

export interface PageDesignerPreviewError {
    type: 'generic' | 'permission' | 'envVars' | 'network'
    detail?: any
}

declare global {
    interface Window {
        PAGE_DESIGNER_PREVIEW?: {
            getToken?: () => string | undefined | Promise<string | undefined>
            onContextChange?: (context: PageDesignerPreviewContext) => void | Promise<void>
            siteId?: string
            previewContext?: PageDesignerPreviewContext
            setPreviewContext?: (context: PageDesignerPreviewContext) => void
            experimentalUnsafeNavigate?: (path: string, action?: 'push' | 'replace') => void
        }
    }
} 