// use-payment-config-manager2.js
import {useState, useEffect} from 'react'
import { usePaymentConfiguration as useSCAPIPaymentConfig } from '@salesforce/commerce-sdk-react'
import {useQuery} from '@tanstack/react-query'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin' 
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {useCountryDetection} from '../../utils/salesforce-payments/country-detection'

export const usePaymentConfigManager = () => {
    const [paymentConfig, setPaymentConfig] = useState(null)
    const [metadata, setMetadata] = useState(null)
    const appOrigin = useAppOrigin() 
    const { currency } = useCurrency()

    // retrieve the country code from the country detection hook
    const {country: countryCode, source: countrySource, isLoading: countryLoading} = useCountryDetection()

    // SCAPI payment config
    const { data: scapiConfigData, isLoading: scapiLoading, error: scapiError } = useSCAPIPaymentConfig({
        parameters: {
            currency: currency,
            countryCode: countryCode
        }
    })
    
    // TODO call new API to get Saved Payment Methods as well and have a setter for that. 
    // Return data in a new state variable


    // TODO manual capture flag is removed from the payments config api and being moved to application config

    // Payment Metadata
    const { data: metadataData, isLoading: metadataLoading, error: metadataError } = useQuery({
        queryKey: ['payment-metadata'],
        queryFn: async () => {
            try {
                const config = getConfig()
                //TEMP STOP GAP (FIXED SOON)
                const response = await fetch(`${appOrigin}/api/payment-metadata`)
                if (!response.ok) {
                    throw new Error('Failed to load payment metadata')
                }
                const data = await response.json()
                return data
            } catch (error) {
                throw error
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes (decide if we need this latency)
    })
    
    // TODO: Replace with feature flag from App Config API or PWA Kit flag
    const isSFPEnabled = true 
    
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