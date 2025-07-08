import {useAccessToken} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'

export const usePaymentConfig = () => {
    const {getTokenWhenReady} = useAccessToken()
    const queryClient = useQueryClient()
    const toast = useToast()
    const {formatMessage} = useIntl()

    // Legacy function (copied from use-payment-api)
    const getPaymentConfig = async (parameters = {}) => {
        const token = await getTokenWhenReady()
        const config = getConfig()
        
        const response = await fetch(`${config.app.commerceAPI.proxyPath}/payments/config`, {
            headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            }
        })
        return response.json()
    }

    // React Query version for payment configuration
    const usePaymentConfiguration = (parameters = {}) => {
        return useQuery({
            queryKey: ['payment-config', parameters],
            queryFn: async () => {
                const token = await getTokenWhenReady() 
              
                const endpoint = `https://localhost/s/RefArch/dw/shop/v25_6/hello/configuration?client_id=cd669706-3638-4dd1-a8b2-310ab900ca53`
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        //Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch payment config: ${response.status}`)
                }
                
                return response.json()
            },
            enabled: !!getTokenWhenReady,
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            onError: (error) => {
                toast({
                    title: formatMessage({
                        defaultMessage: 'Failed to load payment configuration',
                        id: 'payment.config.error'
                    }),
                    status: 'error'
                })
            }
        })
    }

    const usePaymentMetadata = () => {
        return useQuery({
            queryKey: ['payment-metadata'],
            queryFn: async () => {
                try {
                            //const response = await fetch('http://localhost:3002/mobify/bundle/development/static/v1.json')
                    
                    // Use your PWA Kit proxy endpoint
                    const response = await fetch('http://localhost:3002/api/payment-metadata')
               
                    console.log('🔍 Fetch response:', response.status, response.ok)
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
            staleTime: 10 * 60 * 1000, // 10 minutes
        })
    }

    return {
        // Legacy API (for backward compatibility)
        //getPaymentConfig,
        
        // React Query APIs
        usePaymentMetadata,
        usePaymentConfiguration
    }
}