/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {useDisclosure} from '@chakra-ui/react'
import {useDntNotification} from '../../../hooks/use-dnt-notification'

/**
 * Custom hook for managing modal states and their interactions
 * Handles drawer menu, store locator, and DNT notification modals
 *
 * @returns {Object} Modal states and handlers
 */
export const useAppModals = () => {
    const location = useLocation()
    const dntNotification = useDntNotification()

    const {
        open: isDrawerMenuOpen,
        onOpen: onDrawerMenuOpen,
        onClose: onDrawerMenuClose
    } = useDisclosure()

    const {
        open: isOpenStoreLocator,
        onOpen: onOpenStoreLocator,
        onClose: onCloseStoreLocator
    } = useDisclosure()

    // Automatically close the mobile navigation when the location path changes
    useEffect(() => {
        onDrawerMenuClose()
    }, [location, onDrawerMenuClose])

    return {
        // Drawer menu state
        isDrawerMenuOpen,
        onDrawerMenuOpen,
        onDrawerMenuClose,

        // Store locator modal state
        isOpenStoreLocator,
        onOpenStoreLocator,
        onCloseStoreLocator,

        // DNT notification state
        dntNotification
    }
}
