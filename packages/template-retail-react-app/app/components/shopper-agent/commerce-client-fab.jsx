/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {IconButton, Portal} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import {COMMERCE_CLIENT_UI_STATE_EVENT} from '@salesforce/retail-react-app/app/constants'
import {
    getPersistedCommerceClientOpenState,
    openCommerceClientWidget
} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

import ShopperAgentWelcomeMessage from './welcome-message'
import CartNudge from './cart-nudge'

const onClient = typeof window !== 'undefined'

/**
 * Floating action button that opens the Commerce Client shopping agent.
 *
 * Rendered when `cc_showFab` is enabled and docked to the corner given by
 * `cc_widgetPosition`. It hides itself while the agent panel is open so it never
 * sits on top of the widget.
 *
 * @param {Object} props - Component props
 * @param {string} [props.position] - Corner to dock to: 'bottom-left' | 'bottom-right' (default)
 * @param {boolean} [props.isPanelOpenByDefault] - Whether the agent panel starts open
 * @returns {JSX.Element|null} The button, or null while the agent panel is open
 */
const CommerceClientFab = ({
    position = 'bottom-right',
    isPanelOpenByDefault = false,
    siteId = 'default',
    welcomeMessage,
    welcomeMessageEnabled = true,
    welcomeMessageDemoMode = false,
    freeShippingNudge
}) => {
    const intl = useIntl()
    const isCartModalOpen = useAddToCartModalContext()?.isOpen === true
    const [cartOverlaySettled, setCartOverlaySettled] = useState(!isCartModalOpen)

    useEffect(() => {
        if (isCartModalOpen) {
            setCartOverlaySettled(false)
            return undefined
        }
        // Wait for the modal's exit animation before mounting/consuming the nudge.
        const timeout = window.setTimeout(() => setCartOverlaySettled(true), 300)
        return () => window.clearTimeout(timeout)
    }, [isCartModalOpen])
    const [isPanelOpen, setIsPanelOpen] = useState(isPanelOpenByDefault)
    const [welcomeReady, setWelcomeReady] = useState(false)
    const launcherRef = useRef(null)
    const welcomeEnabled = welcomeMessageEnabled !== false && welcomeMessageEnabled !== 'false'
    const greeting =
        welcomeMessage ??
        intl.formatMessage({
            id: 'shopper_agent.welcome.message',
            defaultMessage: 'Hi! Welcome to our store. Looking for holiday gift inspiration?'
        })

    useEffect(() => {
        if (!onClient) return undefined

        // sessionStorage is SSR-unsafe, so the persisted state is reconciled on mount.
        const persistedOpen = getPersistedCommerceClientOpenState()
        if (persistedOpen !== undefined) {
            setIsPanelOpen(persistedOpen)
        }

        setWelcomeReady(true)

        const handleUiStateUpdate = (event) => {
            const {property, value} = event?.detail || {}
            if (property === 'isOpen') {
                setIsPanelOpen(Boolean(value))
            }
        }

        window.addEventListener(COMMERCE_CLIENT_UI_STATE_EVENT, handleUiStateUpdate)
        return () => {
            window.removeEventListener(COMMERCE_CLIENT_UI_STATE_EVENT, handleUiStateUpdate)
        }
    }, [])

    if (isPanelOpen || isCartModalOpen || !cartOverlaySettled) {
        return null
    }

    const welcomeNudge =
        welcomeReady && welcomeEnabled && greeting.trim() ? (
            <ShopperAgentWelcomeMessage
                key={siteId}
                siteId={siteId}
                demoMode={welcomeMessageDemoMode === true || welcomeMessageDemoMode === 'true'}
                position={position}
                message={greeting}
                dismissLabel={intl.formatMessage({
                    id: 'shopper_agent.welcome.dismiss',
                    defaultMessage: 'Dismiss welcome message'
                })}
                onOpen={() => openCommerceClientWidget(true)}
                onDismiss={() => launcherRef.current?.focus()}
            />
        ) : null

    return (
        <Portal>
            {welcomeReady &&
            (freeShippingNudge?.enabled === true || freeShippingNudge?.enabled === 'true') ? (
                <CartNudge
                    config={freeShippingNudge}
                    siteId={siteId}
                    position={position}
                    demoMode={welcomeMessageDemoMode === true || welcomeMessageDemoMode === 'true'}
                    onDismiss={() => launcherRef.current?.focus()}
                    fallback={welcomeNudge}
                />
            ) : (
                welcomeNudge
            )}
            <IconButton
                ref={launcherRef}
                data-testid="commerce-client-fab"
                aria-label={intl.formatMessage({
                    id: 'header.button.assistive_msg.ask_shopping_agent',
                    defaultMessage: 'Ask Shopping Agent'
                })}
                icon={<SparkleIcon boxSize={6} />}
                onClick={() => openCommerceClientWidget(true)}
                position="fixed"
                bottom={6}
                {...(position === 'bottom-left' ? {left: 6} : {right: 6})}
                zIndex="sticky"
                isRound
                boxSize="56px"
                minWidth="56px"
                bg="black"
                color="white"
                boxShadow="lg"
                _hover={{bg: 'gray.700'}}
                _active={{bg: 'gray.800'}}
            />
        </Portal>
    )
}

CommerceClientFab.propTypes = {
    position: PropTypes.oneOf(['bottom-left', 'bottom-right']),
    isPanelOpenByDefault: PropTypes.bool,
    siteId: PropTypes.string,
    welcomeMessage: PropTypes.string,
    welcomeMessageEnabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    welcomeMessageDemoMode: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    freeShippingNudge: PropTypes.object
}

export default CommerceClientFab
