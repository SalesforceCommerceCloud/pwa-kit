// packages/template-retail-react-app/app/hooks/salesforce-payments/use-payment-config-manager.js

import {useState, useEffect} from 'react'
import {usePaymentConfig} from './use-payment-config'

/**
 * Manages payment configuration and feature flag from API
 * API returns: { issalesforcePaymentsEnabled: boolean, config: {...}, metadata: {...} }
 */
export const usePaymentConfigManager = () => {
    const [paymentConfig, setPaymentConfig] = useState(null)
    const [metadata, setMetadata] = useState(null)  // ✅ Change this
    const [isSFPEnabled, setIsSFPEnabled] = useState(false)        
    
    // ✅ Correct usage - get the hook first, then call it
    const { usePaymentConfiguration, usePaymentMetadata } = usePaymentConfig()
    const { data: configData, isLoading: configLoading, error: configError } = usePaymentConfiguration()
    const { data: metadataData, isLoading: metadataLoading, error: metadataError } = usePaymentMetadata()

    
    useEffect(() => {
        if (configData) {
            console.log('🔍 Payment Config Manager Debug:', {
                configData,
                metadataData,
                configLoading,
                metadataLoading
            })
            const isSFPEnabledFromAPI = configData.salesforce_payments_allowed
            // ✅ Set feature flag from API response
            setIsSFPEnabled(isSFPEnabledFromAPI)
            
            // ✅ Only save config data if SFP is enabled
            if (isSFPEnabledFromAPI) {
                setPaymentConfig(configData)
            } else {
                // ✅ Clear any existing config if disabled
                setPaymentConfig(null)
            }
        }
    }, [configData])

    useEffect(() => {
        if (metadataData) {
            console.log('🔍 Processing metadata data:', metadataData)
            setMetadata(metadataData)
        }
    }, [metadataData])

    // ✅ Both API calls must complete
    const isLoading = configLoading || metadataLoading
    const error = configError || metadataError

        
    return {
        paymentConfig,
        metadata,
        paymentConfigLoading: isLoading,
        paymentConfigError: error,
        isSFPEnabled, // ✅ This comes from API, not hardcoded
        isReady: !isLoading && !!configData && !!metadataData && isSFPEnabled // ✅ API call completed
    }
}