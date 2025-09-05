// use-payment-config-manager2.js
import {useState, useEffect} from 'react'
import {useAccessToken} from '@salesforce/commerce-sdk-react'
import { usePaymentConfiguration as useSCAPIPaymentConfig } from '@salesforce/commerce-sdk-react'
import {useQuery} from '@tanstack/react-query'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin' // Add this import


export const usePaymentConfigManager = () => {
    const [paymentConfig, setPaymentConfig] = useState(null)
    const [metadata, setMetadata] = useState(null)
    const appOrigin = useAppOrigin() 

    // ✅ SCAPI payment config
    const { data: scapiConfigData, isLoading: scapiLoading, error: scapiError } = useSCAPIPaymentConfig({
        parameters: {
            currency: 'USD',
            countryCode: 'US'
        }
    })
    
    // ✅ Metadata
    const { data: metadataData, isLoading: metadataLoading, error: metadataError } = useQuery({
        queryKey: ['payment-metadata'],
        queryFn: async () => {
            try {
                const config = getConfig()
                //const response = await fetch(`${config.app.commerceAPI.proxyPath}/payment-metadata`)
                //TEMP STOP GAP (FIXED SOON)
                const response = await fetch(`${appOrigin}/api/payment-metadata`)
                //const response = await fetch('http://localhost:3002/api/payment-metadata')
                //const response = await fetch('http://localhost:3002/api/payment-metadata')
                if (!response.ok) {
                    throw new Error('Failed to load payment metadata')
                }
                const data = await response.json()
                console.log('✅ Metadata loaded successfully:', data)
                return data
            } catch (error) {
                console.error('❌ Fetch error:', error)
                throw error
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes (decide if we need this latency)
    })
    
    const isSFPEnabled = true // TODO: Replace with actual feature flag from API
    
    // Business logic...
    useEffect(() => {
        if (scapiConfigData && isSFPEnabled) {
            setPaymentConfig(scapiConfigData)
        } else {
            setPaymentConfig(null)
        }
    }, [scapiConfigData, isSFPEnabled])
    
    useEffect(() => {
        if (metadataData) {
            setMetadata(metadataData)
        }
    }, [metadataData])
    
    return {
        paymentConfig,
        metadata,
        paymentConfigLoading: scapiLoading || metadataLoading,
        paymentConfigError: scapiError || metadataError,
        isSFPEnabled,
        isPaymentsConfigReady: !scapiLoading && !metadataLoading && !!scapiConfigData && !!metadataData && isSFPEnabled
    }
}