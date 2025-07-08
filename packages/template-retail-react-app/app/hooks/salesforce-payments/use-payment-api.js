import {useAuthContext} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// calls the APIs
export const usePaymentAPIs = () => {
    const {auth} = useAuthContext()

    // lets keep this for now but create separate hooks for each API to keep it consistent
    const getPaymentConfig = async (parameters = {}) => {
        const token = await auth.ready()
        const config = getConfig()
        
        const response = await fetch(`${config.app.commerceAPI.proxyPath}/payments/config`, {
            headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            }
        })
        return response.json()
    }
    return {
        getPaymentConfig
    }
}