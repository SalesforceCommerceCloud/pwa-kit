/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'
import {keyframes} from '@emotion/react'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'

const welcomeEntrance = keyframes`
    0% { opacity: 0; transform: translateY(20px) scale(0.88); }
    65% { opacity: 1; transform: translateY(-5px) scale(1.03); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
`
const welcomePulse = keyframes`
    0%, 100% { box-shadow: 0 8px 28px #37307733; }
    50% { box-shadow: 0 0 0 8px #7762d626, 0 14px 40px #245b9452; }
`
const WelcomeContainer = styled.div`
    animation: ${welcomeEntrance} 250ms ease-out both, ${welcomePulse} 2400ms ease-in-out 300ms 4;
    &:hover,
    &:focus-within {
        animation-play-state: paused;
    }
    button:focus-visible {
        outline: 3px solid #b9f5e4;
        outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`

const shownThisPage = new Set()

const styles = {
    container: {
        position: 'fixed',
        bottom: '24px',
        zIndex: 'var(--chakra-zIndices-sticky, 1100)',
        display: 'flex',
        alignItems: 'flex-start',
        width: '21.5rem',
        maxWidth: 'calc(100vw - 116px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '20px',
        background: 'linear-gradient(125deg, #4939a7 0%, #245b94 55%, #00666f 100%)',
        color: '#fff',
        boxShadow: '0 8px 28px #37307733'
    },
    message: {
        flex: 1,
        minWidth: 0,
        margin: 0,
        padding: '18px 0 18px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        border: 0,
        borderRadius: '20px',
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        fontSize: '15px',
        lineHeight: 1.5,
        fontWeight: 500,
        textAlign: 'left',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        cursor: 'pointer'
    },
    dismiss: {
        flex: '0 0 44px',
        width: '44px',
        height: '44px',
        margin: 0,
        padding: 0,
        border: 0,
        borderRadius: '50%',
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        fontSize: '22px',
        cursor: 'pointer'
    }
}

const ShopperAgentWelcomeMessage = ({
    siteId,
    message,
    dismissLabel,
    demoMode = false,
    position = 'bottom-right',
    onOpen,
    onDismiss
}) => {
    const [visible, setVisible] = useState(false)
    const storageKey = `pwa-kit:shopper-agent:welcome:${siteId}:v1`

    useEffect(() => {
        if (demoMode) {
            if (!shownThisPage.has(storageKey)) setVisible(true)
            return
        }
        try {
            if (window.localStorage.getItem(storageKey) !== 'shown') setVisible(true)
        } catch {
            // Avoid repeated invitations when the browser cannot retain visit state.
        }
    }, [storageKey, demoMode])

    useEffect(() => {
        if (!visible || demoMode) return
        try {
            window.localStorage.setItem(storageKey, 'shown')
        } catch {
            setVisible(false)
        }
    }, [visible, storageKey, demoMode])

    if (!visible) return null

    return (
        <WelcomeContainer
            data-testid="shopper-agent-welcome"
            style={{
                ...styles.container,
                ...(position === 'bottom-left' ? {left: '92px'} : {right: '92px'})
            }}
        >
            <button
                type="button"
                style={styles.message}
                aria-label={message}
                onClick={() => {
                    if (demoMode) shownThisPage.add(storageKey)
                    setVisible(false)
                    onOpen()
                }}
            >
                <span
                    aria-hidden="true"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: '0 0 36px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.14)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <SparkleIcon boxSize={5} color="white" focusable="false" />
                </span>
                <span style={{minWidth: 0, paddingTop: '2px'}}>{message}</span>
            </button>
            <button
                type="button"
                style={styles.dismiss}
                aria-label={dismissLabel}
                onClick={() => {
                    if (demoMode) shownThisPage.add(storageKey)
                    setVisible(false)
                    onDismiss()
                }}
            >
                <span aria-hidden="true">×</span>
            </button>
        </WelcomeContainer>
    )
}

ShopperAgentWelcomeMessage.propTypes = {
    siteId: PropTypes.string.isRequired,
    demoMode: PropTypes.bool,
    message: PropTypes.string.isRequired,
    dismissLabel: PropTypes.string.isRequired,
    position: PropTypes.oneOf(['bottom-left', 'bottom-right']),
    onOpen: PropTypes.func.isRequired,
    onDismiss: PropTypes.func.isRequired
}

export default ShopperAgentWelcomeMessage
