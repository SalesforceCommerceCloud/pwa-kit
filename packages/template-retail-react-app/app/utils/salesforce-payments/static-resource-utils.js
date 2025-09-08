import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Extracts instance identifier from various organization ID patterns
 * 
 * @param {string} organizationId - The organization ID
 * @returns {string} Instance identifier for hostname construction
 * 
 * @example
 * extractInstanceId('f_ecom_zyoe_003') // Returns: 'zyoe-003'
 * extractInstanceId('f_ecom_zzte_001') // Returns: 'zzte-001' 
 * extractInstanceId('custom_org_name') // Returns: 'custom-org-name'
 */
const extractInstanceId = (organizationId) => {
    // Handle common f_ecom_ pattern
    if (organizationId.startsWith('f_ecom_')) {
        return organizationId.replace('f_ecom_', '').replace(/_/g, '-')
    }
    
    // Handle other patterns - convert underscores to hyphens
    return organizationId.replace(/_/g, '-')
}

/**
 * Builds the base URL for Commerce Cloud static resources
 * 
 * @returns {string} Base URL for static resources
 * 
 * @example
 * buildStaticResourceBaseUrl()
 * // Returns: 'https://zyoe-003.unified.demandware.net/on/demandware.static/Sites-Site/-/-/internal'
 */
export const buildStaticResourceBaseUrl = () => {
    const config = getConfig()
    const organizationId = config.app.commerceAPI.parameters.organizationId
    
    if (!organizationId) {
        throw new Error('Organization ID not found in configuration')
    }
    
    // Extract the instance identifier from organizationId
    const instanceId = extractInstanceId(organizationId)
    
    // Build the base URL for static resources
    return `https://${instanceId}.unified.demandware.net/on/demandware.static/Sites-Site/-/-/internal`
}