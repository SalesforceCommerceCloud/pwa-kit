/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useRef, useState} from 'react'

export const useOtpInputs = (length = 8, onComplete) => {
    const [values, setValues] = useState(new Array(length).fill(''))
    const inputRefs = useRef([])

    const setValue = (index, value) => {
        // Only digits
        if (!/^\d*$/.test(value)) return

        const newValues = [...values]
        newValues[index] = value
        setValues(newValues)

        // Auto-focus next input if value entered
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        return newValues.join('')
    }

    const clear = () => {
        setValues(new Array(length).fill(''))
        inputRefs.current[0]?.focus()
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
        if (pastedData.length === length) {
            const newValues = pastedData.split('')
            setValues(newValues)
            inputRefs.current[length - 1]?.focus()
            onComplete?.(pastedData)
        }
    }

    return {
        values,
        setValue,
        clear,
        handleKeyDown,
        handlePaste,
        inputRefs
    }
}
