// use-payment-config-manager2.js
import {useState, useEffect} from 'react'
import {useAccessToken} from '@salesforce/commerce-sdk-react'
import { usePaymentConfiguration as useSCAPIPaymentConfig } from '@salesforce/commerce-sdk-react'
import {useQuery} from '@tanstack/react-query'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin' // Add this import
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency' // ✅ Add this


export const usePaymentConfigManager = () => {
    const [paymentConfig, setPaymentConfig] = useState(null)
    const [metadata, setMetadata] = useState(null)
    const appOrigin = useAppOrigin() 
    const { currency } = useCurrency()

    // Get server-detected country (works only from MRT/CloudFront)
    const { data: serverCountry } = useQuery({
        queryKey: ['server-country'],
        queryFn: async () => {
            const response = await fetch(`${appOrigin}/api/detect-country`)
            const data = await response.json()
            return data.countryCode
        },
        staleTime: 30 * 60 * 1000, // 30 minutes - given country doesn't change often or we can make it shorter
    })

    // Determine best country code using priority order
    const getCountryCode = () => {
        // you can get it from basket, BUT its not necessary that a page, especially PDP
        // will have a basket as yet 
        
        // Server-detected country (MRT/CloudFront)
        if (serverCountry) {
            return { country: serverCountry, source: 'server' }
        }
        
        // else maybe: Browser locale (fallback)
        if (typeof window !== 'undefined') {
            const browserLocale = navigator.language || navigator.languages?.[0]
            if (browserLocale) {
                const countryFromLocale = browserLocale.split('-')[1]
                if (countryFromLocale && countryFromLocale.length === 2) {
                    return { country: countryFromLocale.toUpperCase(), source: 'browser' }
                }
            }
        }
        
        // Priority 4: Default fallback
        return { country: 'US', source: 'default' }
    }
    const { country: countryCode, source } = getCountryCode()
    // ✅ SCAPI payment config
    const { data: scapiConfigData, isLoading: scapiLoading, error: scapiError } = useSCAPIPaymentConfig({
        parameters: {
            currency: currency,
            countryCode: countryCode
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