/**
 * Page Designer Preview Utilities
 * 
 * This module provides utilities for managing page designer preview functionality,
 * including context management and communication with the parent window.
 */

/**
 * Post message to parent window with preview context
 * @param {Object} context - The preview context to send
 * @param {string} origin - The target origin
 * @param {Window} targetWindow - The target window
 */
export const postMessageAsync = async (context, origin, targetWindow) => {
    return new Promise((resolve, reject) => {
        const message = {
            type: 'pageDesignerPreviewContext',
            source: 'page-designer-preview-client',
            payload: context
        };

        const handleMessage = (event) => {
            if (event.origin !== origin) return;
            
            if (event.data.type === 'pageDesignerPreviewContextResponse') {
                window.removeEventListener('message', handleMessage);
                resolve(event.data);
            }
        };

        window.addEventListener('message', handleMessage);
        
        try {
            targetWindow.postMessage(message, origin);
        } catch (error) {
            window.removeEventListener('message', handleMessage);
            reject(error);
        }
    });
};

/**
 * Debug utility for preview messages
 * @param {string} message - Debug message
 * @param {*} data - Data to log
 */
export const debug = (message, data) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Page Designer Preview] ${message}`, data);
    }
};

/**
 * Build a post message async handler
 * @param {Function} handler - The message handler function
 * @returns {Function} - Async handler function
 */
export const buildPostMessageAsyncHandler = (handler) => {
    return async (message, origin, targetWindow) => {
        try {
            const result = await handler(message);
            return result;
        } catch (error) {
            debug('Error in post message handler', error);
            throw error;
        }
    };
};

/**
 * Create preview context from form data
 * @param {Object} formData - Form data from preview interface
 * @returns {Object} - Preview context object
 */
export const createPreviewContext = (formData) => {
    const { date, time, sourceCode, customerGroupIds, customQualifiers } = formData;
    
    let effectiveDateTime = null;
    if (date && time) {
        const dateTime = new Date(date);
        const [hours, minutes] = time.split(':');
        dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        effectiveDateTime = dateTime.toISOString();
    }

    const context = {
        effectiveDateTime,
        sourceCode: sourceCode || null,
        customerGroupIds: customerGroupIds ? customerGroupIds.split(',').map(id => id.trim()) : [],
        customQualifiers: customQualifiers ? 
            customQualifiers.reduce((acc, qualifier) => {
                if (qualifier.key && qualifier.value) {
                    acc[qualifier.key] = qualifier.value;
                }
                return acc;
            }, {}) : {}
    };

    return context;
};

/**
 * Validate preview context
 * @param {Object} context - Preview context to validate
 * @returns {boolean} - Whether context is valid
 */
export const validatePreviewContext = (context) => {
    if (!context) return false;
    
    // Validate effectiveDateTime if present
    if (context.effectiveDateTime) {
        const date = new Date(context.effectiveDateTime);
        if (isNaN(date.getTime())) {
            return false;
        }
    }

    // Validate customerGroupIds if present
    if (context.customerGroupIds && !Array.isArray(context.customerGroupIds)) {
        return false;
    }

    // Validate customQualifiers if present
    if (context.customQualifiers && typeof context.customQualifiers !== 'object') {
        return false;
    }

    return true;
}; 