/**
 * Safely retrieves store information from localStorage
 * @param {string} siteId - The site ID to construct the localStorage key
 * @returns {object|null} Store information object or null if not found/error
 */
export const getSelectedStoreData = (siteId) => {
    // Handle SSR and localStorage errors
    if (typeof window === 'undefined') {
        return null
    }
    
    try {
        const storeInfoKey = `store_${siteId}`
        const storeInfo = JSON.parse(window.localStorage.getItem(storeInfoKey) || 'null')
        return storeInfo
    } catch (error) {
        console.debug('Failed to access localStorage:', error)
        return null
    }
}