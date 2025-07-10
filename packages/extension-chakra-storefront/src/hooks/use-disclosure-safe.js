/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useCallback} from 'react'
import {useDisclosure as chakraUseDisclosure} from '@chakra-ui/react'

// Server-side implementation using useState
const useDisclosureServer = (props = {}) => {
    const {defaultOpen = false} = props || {}
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const onOpen = useCallback(() => setIsOpen(true), [])
    const onClose = useCallback(() => setIsOpen(false), [])
    const onToggle = useCallback(() => setIsOpen((prev) => !prev), [])

    return {
        isOpen,
        open: isOpen, // Support both naming conventions
        onOpen,
        onClose,
        onToggle,
        getButtonProps: () => ({
            'aria-expanded': isOpen,
            onClick: onToggle
        }),
        getDisclosureProps: () => ({
            hidden: !isOpen
        })
    }
}

// Client-side implementation using Chakra's useDisclosure
// const useDisclosureClient = (props = {}) => {
//     const disclosure = chakraUseDisclosure(props)

//     // Add 'open' alias for backward compatibility
//     return {
//         ...disclosure,
//         open: disclosure.isOpen
//     }
// }

/**
 * Custom useDisclosure hook that:
 * - On server side: uses React useState to mimic useDisclosure behavior
 * - On client side: uses Chakra's useDisclosure
 */
export const useDisclosure =
    typeof window === 'undefined' ? useDisclosureServer : chakraUseDisclosure
