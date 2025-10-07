/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Client-side cryptographic utilities for secure customer lookup
 * 
 * This module provides functions for:
 * - Generating secure nonces
 * - Encrypting/decrypting customer lookup responses
 * - Preventing user enumeration attacks through response obfuscation
 */

/**
 * Nonce configuration for response obfuscation
 */
const NONCE_CONFIG = {
    LENGTH: 16, // 16 bytes = 32 hex characters
    ENCODING: 'base64'
}

/**
 * Generate a secure nonce for response obfuscation
 * Uses crypto.getRandomValues for cryptographically secure random bytes
 */
export function generateSecureNonce() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        // Browser environment - use Web Crypto API
        const array = new Uint8Array(NONCE_CONFIG.LENGTH)
        window.crypto.getRandomValues(array)
        return btoa(String.fromCharCode.apply(null, array))
    } else {
        // Fallback for server-side or older browsers
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        let result = ''
        for (let i = 0; i < NONCE_CONFIG.LENGTH; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return btoa(result)
    }
}

/**
 * Decrypt the obfuscated response data using the client's nonce
 * This reverses the XOR encryption applied on the server
 * 
 * @param {string} nonce - The nonce used for encryption
 * @param {string} obfuscatedData - The encrypted response data
 * @returns {Object} The decrypted customer lookup result
 */
export function decryptCustomerLookupResponse(nonce, obfuscatedData) {
    try {
        // Convert base64 back to buffer
        const encryptedBuffer = atob(obfuscatedData)
        
        // Reverse XOR encryption using the nonce
        let decrypted = ''
        for (let i = 0; i < encryptedBuffer.length; i++) {
            const encryptedByte = encryptedBuffer.charCodeAt(i)
            const nonceByte = nonce.charCodeAt(i % nonce.length)
            const decryptedByte = encryptedByte ^ nonceByte
            decrypted += String.fromCharCode(decryptedByte)
        }
        
        // Parse the JSON result
        return JSON.parse(decrypted)
        
    } catch (error) {
        console.error('Failed to decrypt customer lookup response:', error)
        // Return safe fallback
        return {
            isRegistered: false,
            shouldShowOtp: false
        }
    }
}

/**
 * Validate that a nonce meets security requirements
 * 
 * @param {string} nonce - The nonce to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateNonce(nonce) {
    return typeof nonce === 'string' && nonce.length >= 8
}

/**
 * Create a secure hash for client-side verification (optional)
 * This can be used for additional integrity checks
 * 
 * @param {string} data - Data to hash
 * @returns {Promise<string>} Hash of the data
 */
export async function createClientHash(data) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Use Web Crypto API for secure hashing
        const encoder = new TextEncoder()
        const dataBuffer = encoder.encode(data)
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
    } else {
        // Fallback simple hash for older browsers
        let hash = 0
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 16)
    }
}
