import {useAccessToken} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'

//STOP GAP HOOK.  Will be replaced with the new hook
export const usePaymentProcessing = () => {
    const {getTokenWhenReady} = useAccessToken()
    const queryClient = useQueryClient()
    const toast = useToast()
    const {formatMessage} = useIntl()

    // ✅ Use useMutation for POST requests
    const paymentMutation = useMutation({
        mutationFn: async (parameters) => {
            const token = await getTokenWhenReady()
            
            const basket_id = parameters.basketId
            const zone_id = parameters.zoneId
            const amount = parameters.amount
            const card_capture_automatic = parameters.cardCaptureAutomatic
            const currency = parameters.currency

            const endpoint = `https://localhost/s/RefArch/dw/shop/v25_6/hello/native/prepare?client_id=cd669706-3638-4dd1-a8b2-310ab900ca53`
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "basket_id": basket_id,
                    "amount": amount,
                    "currency": currency,
                    "zone_id": zone_id,
                    "payment_method_type": "card",
                    "card_capture_automatic": card_capture_automatic
                })
            })

            if (!response.ok) {
                throw new Error(`Failed to process payment: ${response.status}`)
            }
            
            const result = await response.json()
            console.log('🔍 Payment processing response:', result)
            return result
        },
        onError: (error) => {
            toast({
                title: formatMessage({
                    defaultMessage: 'Failed to process payment',
                    id: 'payment.process.error'
                }),
                status: 'error'
            })
        }
    })

    // ✅ Return the mutation function and loading state
    return {
        processPayment: paymentMutation.mutateAsync,  // ✅ This is a function, not a hook
        isProcessing: paymentMutation.isPending
    }
}