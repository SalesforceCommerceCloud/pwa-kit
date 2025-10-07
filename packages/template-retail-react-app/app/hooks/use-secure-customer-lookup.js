/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState} from 'react'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {generateSecureNonce, decryptCustomerLookupResponse} from '@salesforce/retail-react-app/app/utils/customer-lookup-crypto'

/**
 * Hook for secure customer lookup functionality with encrypted responses
 * 
 * This hook provides a secure way to:
 * 1. Check if an email is registered without exposing customer data
 * 2. Handle encrypted responses to prevent user enumeration attacks
 * 3. Generate secure nonces for response obfuscation
 * 4. Provide uniform user experience regardless of registration status
 */
export const useSecureCustomerLookup = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState('')
    const appOrigin = useAppOrigin()

    /**
     * Performs secure customer lookup with encrypted response
     * @param {string} email - Customer email to lookup
     * @returns {Promise<Object>} Lookup result with registration status
     */
    const lookupCustomer = async (email) => {
        setIsLoading(true)
        setError(null)
        setMessage('')

        try {
            // Generate a secure nonce for response encryption
            const nonce = generateSecureNonce()

            const response = await fetch(`${appOrigin}/api/secure-customer-lookup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    nonce
                })
            })

            const result = await response.json()
            
            // All responses are successful with encrypted data
            if (!result.success || !result.data) {
                throw new Error('Invalid response format')
            }
            
            // Set the uniform message for display
            setMessage(result.message)
            
            // Decrypt the response using our nonce
            const decryptedResult = decryptCustomerLookupResponse(nonce, result.data)
            
            return {
                isRegistered: decryptedResult.isRegistered,
                shouldShowOtp: decryptedResult.shouldShowOtp,
                message: decryptedResult.message
            }

        } catch (err) {
            const errorMessage = err.message || 'Unable to process request'
            setError(errorMessage)
            setMessage("We've sent verification instructions to your email if it's registered with us.")
            
            // Return safe fallback
            return {
                isRegistered: false,
                shouldShowOtp: false,
                message: "We've sent verification instructions to your email if it's registered with us."
            }
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Clears any existing error state and message
     */
    const clearState = () => {
        setError(null)
        setMessage('')
    }

    return {
        lookupCustomer,
        isLoading,
        error,
        message,
        clearState
    }
}
