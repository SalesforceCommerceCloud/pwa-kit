/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

(function() {
    'use strict'

    // Constants
    const POST_MESSAGE_SOURCE = 'page-designer-preview-client'
    const POST_MESSAGE_DESTINATION = 'page-designer-preview-server'

    // Initialize PAGE_DESIGNER_PREVIEW object
    if (!window.PAGE_DESIGNER_PREVIEW) {
        window.PAGE_DESIGNER_PREVIEW = {}
    }

    // Utility functions
    function debug(message) {
        if (window.PAGE_DESIGNER_PREVIEW.debug) {
            console.log('[Page Designer Preview Client]', message)
        }
    }

    function postMessageToParent(message) {
        if (window.parent !== window.self) {
            try {
                window.parent.postMessage(message, '*')
            } catch (error) {
                console.warn('Failed to post message to parent:', error)
            }
        }
    }

    function sendReadyMessage() {
        postMessageToParent({
            type: 'ready',
            source: POST_MESSAGE_SOURCE
        })
    }

    function sendContextChangeMessage(context) {
        postMessageToParent({
            type: 'contextChange',
            source: POST_MESSAGE_SOURCE,
            payload: context
        })
    }

    function sendNavigationChangeMessage(path) {
        postMessageToParent({
            type: 'navigationChange',
            source: POST_MESSAGE_SOURCE,
            payload: {path}
        })
    }

    // Parse preview parameters from URL
    function parsePreviewParams() {
        const url = new URL(window.location.href)
        return {
            effectiveDateTime: url.searchParams.get('__effectiveDateTime') || null,
            sourceCode: url.searchParams.get('__sourceCode') || '',
            customerGroupIds: url.searchParams.get('__customerGroupIds')?.split(',') || [],
            customQualifiers: url.searchParams.get('__customQualifiers') 
                ? JSON.parse(url.searchParams.get('__customQualifiers')) 
                : {},
            device: url.searchParams.get('__device') || 'desktop'
        }
    }

    // Apply preview context to the page
    function applyPreviewContext(context) {
        debug('Applying preview context:', context)

        // Store context in session storage for persistence
        if (context) {
            sessionStorage.setItem('pageDesignerPreviewContext', JSON.stringify(context))
        }

        // Apply device-specific styles
        if (context.device) {
            applyDeviceStyles(context.device)
        }

        // Apply effective date/time if provided
        if (context.effectiveDateTime) {
            // This would typically involve setting a global date/time context
            // that the page's JavaScript can use for time-sensitive content
            window.PAGE_DESIGNER_PREVIEW_EFFECTIVE_DATETIME = context.effectiveDateTime
        }

        // Apply source code if provided
        if (context.sourceCode) {
            window.PAGE_DESIGNER_PREVIEW_SOURCE_CODE = context.sourceCode
        }

        // Apply customer groups if provided
        if (context.customerGroupIds && context.customerGroupIds.length > 0) {
            window.PAGE_DESIGNER_PREVIEW_CUSTOMER_GROUPS = context.customerGroupIds
        }

        // Apply custom qualifiers if provided
        if (context.customQualifiers && Object.keys(context.customQualifiers).length > 0) {
            window.PAGE_DESIGNER_PREVIEW_CUSTOM_QUALIFIERS = context.customQualifiers
        }
    }

    // Apply device-specific styles
    function applyDeviceStyles(device) {
        const body = document.body
        const existingClass = body.className.match(/preview-device-\w+/)
        
        if (existingClass) {
            body.className = body.className.replace(existingClass[0], '')
        }
        
        body.className += ' preview-device-' + device

        // Apply responsive styles based on device
        const style = document.getElementById('preview-device-styles') || document.createElement('style')
        style.id = 'preview-device-styles'
        
        let css = ''
        switch (device) {
            case 'phone_portrait':
                css = `
                    body.preview-device-phone_portrait {
                        max-width: 375px !important;
                        margin: 0 auto !important;
                        border: 1px solid #ccc;
                        min-height: 667px;
                    }
                `
                break
            case 'tablet_landscape':
                css = `
                    body.preview-device-tablet_landscape {
                        max-width: 1024px !important;
                        margin: 0 auto !important;
                        border: 1px solid #ccc;
                        min-height: 768px;
                    }
                `
                break
            case 'desktop':
            default:
                css = `
                    body.preview-device-desktop {
                        max-width: none !important;
                        margin: 0 !important;
                        border: none;
                    }
                `
                break
        }
        
        style.textContent = css
        if (!document.getElementById('preview-device-styles')) {
            document.head.appendChild(style)
        }
    }

    // Handle messages from parent window
    function handleParentMessage(event) {
        if (event.source !== window.parent) {
            return
        }

        const {type, payload} = event.data

        switch (type) {
            case 'contextChange':
                applyPreviewContext(payload)
                break
            case 'reload':
                window.location.reload()
                break
            case 'navigate':
                if (payload && payload.path) {
                    window.location.href = payload.path
                }
                break
            default:
                debug('Unknown message type:', type)
        }
    }

    // Initialize preview functionality
    function initializePreview() {
        debug('Initializing Page Designer Preview')

        // Listen for messages from parent
        window.addEventListener('message', handleParentMessage)

        // Parse initial preview parameters from URL
        const initialContext = parsePreviewParams()
        if (initialContext.effectiveDateTime || initialContext.sourceCode || 
            initialContext.customerGroupIds.length > 0 || 
            Object.keys(initialContext.customQualifiers).length > 0) {
            applyPreviewContext(initialContext)
        }

        // Send ready message when page is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', sendReadyMessage)
        } else {
            sendReadyMessage()
        }

        // Watch for navigation changes
        let currentPath = window.location.pathname + window.location.search
        const originalPushState = history.pushState
        const originalReplaceState = history.replaceState

        history.pushState = function() {
            originalPushState.apply(history, arguments)
            const newPath = window.location.pathname + window.location.search
            if (newPath !== currentPath) {
                currentPath = newPath
                sendNavigationChangeMessage(newPath)
            }
        }

        history.replaceState = function() {
            originalReplaceState.apply(history, arguments)
            const newPath = window.location.pathname + window.location.search
            if (newPath !== currentPath) {
                currentPath = newPath
                sendNavigationChangeMessage(newPath)
            }
        }

        // Watch for popstate events
        window.addEventListener('popstate', function() {
            const newPath = window.location.pathname + window.location.search
            if (newPath !== currentPath) {
                currentPath = newPath
                sendNavigationChangeMessage(newPath)
            }
        })

        // Expose functions to global scope for parent access
        window.PAGE_DESIGNER_PREVIEW.sendReadyMessage = sendReadyMessage
        window.PAGE_DESIGNER_PREVIEW.sendContextChangeMessage = sendContextChangeMessage
        window.PAGE_DESIGNER_PREVIEW.sendNavigationChangeMessage = sendNavigationChangeMessage
        window.PAGE_DESIGNER_PREVIEW.applyPreviewContext = applyPreviewContext
        window.PAGE_DESIGNER_PREVIEW.parsePreviewParams = parsePreviewParams
    }

    // Start initialization
    initializePreview()
})() 