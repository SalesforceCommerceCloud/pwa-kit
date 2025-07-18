/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import type {PageDesignerPreviewMessage} from './types'

/**
 * Detects if the current page is running in Page Designer Preview mode
 * by checking if it's embedded in a Business Manager iframe
 */
export const detectPageDesignerPreview = (): boolean => {
    if (typeof window === 'undefined') {
        return false
    }

    // Check if we're in an iframe
    if (window.parent === window.self) {
        return false
    }

    // Check if the parent window has Business Manager characteristics
    try {
        const parentOrigin = window.parent.location.origin
        const currentOrigin = window.location.origin
        
        // Business Manager typically runs on a different domain/port
        if (parentOrigin !== currentOrigin) {
            // Additional checks for Business Manager specific patterns
            const parentUrl = window.parent.location.href
            if (parentUrl.includes('/bm/') || parentUrl.includes('businessmanager')) {
                return true
            }
        }
    } catch (error) {
        // Cross-origin restrictions will throw an error
        // This is expected when running in a Business Manager iframe
        return true
    }

    return false
}

/**
 * Gets the client script URL for Page Designer Preview
 */
export const getPageDesignerClientScript = (): string => {
    // This would typically be served from the Business Manager
    // For now, we'll use a placeholder that can be configured
    return '/on/demandware.static/Sites-Site/-/default/application/page-designer/pd-preview-client.js'
}

/**
 * Posts a message to the parent window (Business Manager)
 */
export const postMessageToParent = (message: PageDesignerPreviewMessage): void => {
    if (typeof window !== 'undefined' && window.parent !== window.self) {
        try {
            window.parent.postMessage(message, '*')
        } catch (error) {
            console.warn('Failed to post message to parent:', error)
        }
    }
}

/**
 * Sends a ready message to indicate the page designer is ready
 */
export const sendReadyMessage = (): void => {
    postMessageToParent({
        type: 'ready',
        source: 'page-designer-preview-client'
    })
}

/**
 * Sends a context change message to the parent
 */
export const sendContextChangeMessage = (context: any): void => {
    postMessageToParent({
        type: 'contextChange',
        source: 'page-designer-preview-client',
        payload: context
    })
}

/**
 * Sends a navigation change message to the parent
 */
export const sendNavigationChangeMessage = (path: string): void => {
    postMessageToParent({
        type: 'navigationChange',
        source: 'page-designer-preview-client',
        payload: {path}
    })
}

/**
 * Builds a URL with preview parameters
 */
export const buildPreviewUrl = (
    baseUrl: string,
    context: {
        effectiveDateTime?: string | null
        sourceCode?: string
        customerGroupIds?: string[]
        customQualifiers?: Record<string, string>
        device?: string
    }
): string => {
    const url = new URL(baseUrl)
    
    if (context.effectiveDateTime) {
        url.searchParams.set('__effectiveDateTime', context.effectiveDateTime)
    }
    
    if (context.sourceCode) {
        url.searchParams.set('__sourceCode', context.sourceCode)
    }
    
    if (context.customerGroupIds && context.customerGroupIds.length > 0) {
        url.searchParams.set('__customerGroupIds', context.customerGroupIds.join(','))
    }
    
    if (context.customQualifiers && Object.keys(context.customQualifiers).length > 0) {
        url.searchParams.set('__customQualifiers', JSON.stringify(context.customQualifiers))
    }
    
    if (context.device) {
        url.searchParams.set('__device', context.device)
    }
    
    return url.toString()
}

/**
 * Parses preview parameters from URL
 */
export const parsePreviewParams = (url: string): {
    effectiveDateTime?: string | null
    sourceCode?: string
    customerGroupIds?: string[]
    customQualifiers?: Record<string, string>
    device?: string
} => {
    const urlObj = new URL(url)
    
    return {
        effectiveDateTime: urlObj.searchParams.get('__effectiveDateTime') || null,
        sourceCode: urlObj.searchParams.get('__sourceCode') || '',
        customerGroupIds: urlObj.searchParams.get('__customerGroupIds')?.split(',') || [],
        customQualifiers: urlObj.searchParams.get('__customQualifiers') 
            ? JSON.parse(urlObj.searchParams.get('__customQualifiers')!) 
            : {},
        device: urlObj.searchParams.get('__device') || 'desktop'
    }
} 