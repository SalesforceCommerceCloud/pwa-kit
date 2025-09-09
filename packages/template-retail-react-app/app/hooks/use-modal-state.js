/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import {useLocation} from 'react-router-dom'

/**
 * Reusable modal state hook
 * - Manages isOpen and optional data payload
 * - Provides onOpen(data) and onClose() handlers
 * - Optionally auto-closes on route changes
 */
export const useModalState = ({closeOnRouteChange = true, resetDataOnClose = true} = {}) => {
    const [state, setState] = useState({
        isOpen: false,
        data: null
    })

    const {pathname} = useLocation()

    useEffect(() => {
        if (closeOnRouteChange && state.isOpen) {
            setState({
                ...state,
                isOpen: false
            })
        }
    }, [pathname])

    return {
        isOpen: state.isOpen,
        data: state.data,
        onOpen: (data) => {
            setState({
                isOpen: true,
                data
            })
        },
        onClose: () => {
            setState({
                isOpen: false,
                data: resetDataOnClose ? null : state.data
            })
        }
    }
}
