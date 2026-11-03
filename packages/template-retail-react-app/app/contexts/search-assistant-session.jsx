/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {createContext, useContext, useRef, useState} from 'react'
import PropTypes from 'prop-types'

const STORAGE_KEY = 'pwa-search-assistant-session'
const SearchAssistantSession = createContext(null)
export const createClientSearchSession = () => ({id: null, active: null, handoffs: new Map()})

// Only an opaque conversation ID survives a reload. Tokens and transcripts stay in memory/server TTL storage.
export const rememberSearchSession = (session, id) => {
    session.id = id
    try {
        if (id) window.sessionStorage.setItem(STORAGE_KEY, id)
        else window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
        /* Private browsing/storage policies must not break search. */
    }
}
export function SearchAssistantSessionProvider({children}) {
    const session = useRef(null)
    if (!session.current) {
        session.current = createClientSearchSession()
        try {
            session.current.id = window.sessionStorage.getItem(STORAGE_KEY)
        } catch {
            /* SSR/storage unavailable. */
        }
    }
    const [handoffState, setHandoffState] = useState({busy: false, error: null})
    return (
        <SearchAssistantSession.Provider value={{session, handoffState, setHandoffState}}>
            {children}
        </SearchAssistantSession.Provider>
    )
}
SearchAssistantSessionProvider.propTypes = {children: PropTypes.node}
export const useSearchAssistantSession = () => useContext(SearchAssistantSession)
