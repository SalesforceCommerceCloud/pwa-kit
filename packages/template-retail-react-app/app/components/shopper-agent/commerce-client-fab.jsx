/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {useLocation} from 'react-router-dom'
import {Box, IconButton, Portal} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    COMMERCE_CLIENT_UI_STATE_EVENT,
    SHOPPER_AGENT_GRADIENT
} from '@salesforce/retail-react-app/app/constants'
import {
    getPersistedCommerceClientOpenState,
    openCommerceClientWidget,
    sendCommerceClientMessage
} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

import ShopperAgentWelcomeMessage from '@salesforce/retail-react-app/app/components/shopper-agent/welcome-message'
import CartNudge from '@salesforce/retail-react-app/app/components/shopper-agent/cart-nudge'

const onClient = typeof window !== 'undefined'

const SPOTLIGHT_DURATION_MS = 8000
const FAB_INSET = 24
const FAB_SIZE = 56

// Pathnames carry a site/locale prefix, so match on the route segment instead of the start.
const getSpotlightType = (pathname = '') => {
    if (/\/product\/[^/]+/.test(pathname)) return 'pdp'
    if (/\/(category\/[^/]+|search)\/?$/.test(pathname)) return 'plp'
    return null
}

const safeDecode = (value) => {
    try {
        return decodeURIComponent(value)
    } catch (e) {
        return value
    }
}

// The question sent to the agent when the shopper taps the highlighted button.
const getSpotlightMessage = (type, pathname = '', search = '') => {
    if (type === 'pdp') {
        const productId = safeDecode(pathname.match(/\/product\/([^/]+)/)?.[1] || '')
        return productId ? `Show details of product ${productId}` : ''
    }
    const query = new URLSearchParams(search).get('q')
    if (query) return `Show me the top products for ${query}`
    const categoryId = safeDecode(pathname.match(/\/category\/([^/]+)/)?.[1] || '')
    return categoryId
        ? `Show me the top products in ${categoryId.replace(/[-_]+/g, ' ')}`
        : 'Show me the top products'
}

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
    const {pathname, search} = useLocation()
    const [isSpotlit, setIsSpotlit] = useState(false)
    const spotlightType = getSpotlightType(pathname)

    // On product listing and product pages the FAB floats to the center of the page
    // for a few seconds with a call-to-action label, then returns to its corner.
    useEffect(() => {
        if (!spotlightType) {
            setIsSpotlit(false)
            return undefined
        }
        setIsSpotlit(true)
        const timer = setTimeout(() => setIsSpotlit(false), SPOTLIGHT_DURATION_MS)
        return () => clearTimeout(timer)
    }, [pathname, spotlightType])

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

    const isLeft = position === 'bottom-left'
    // The FAB is fixed to a bottom corner; slide it horizontally to the viewport center,
    // keeping its vertical position.
    const centerOffset = FAB_INSET + FAB_SIZE / 2
    const spotlightTransform = `translateX(calc(${isLeft ? '' : '-'}50vw ${
        isLeft ? '-' : '+'
    } ${centerOffset}px))`
    const label =
        spotlightType === 'pdp'
            ? intl.formatMessage({
                  id: 'commerce_client_fab.label.explore_product',
                  defaultMessage: 'Explore this product'
              })
            : intl.formatMessage({
                  id: 'commerce_client_fab.label.browse_collection',
                  defaultMessage: 'Browse Collection'
              })

    return (
        <Portal>
            {isSpotlit && (
                <Box
                    data-testid="commerce-client-fab-label"
                    position="fixed"
                    bottom={`${FAB_INSET + FAB_SIZE + 12}px`}
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex="sticky"
                    bg={SHOPPER_AGENT_GRADIENT}
                    color="white"
                    border="1px solid"
                    borderColor="whiteAlpha.400"
                    px={4}
                    py={2}
                    borderRadius="full"
                    boxShadow="lg"
                    fontWeight="semibold"
                    whiteSpace="nowrap"
                    pointerEvents="none"
                    aria-hidden="true"
                >
                    {label}
                </Box>
            )}
            {!isSpotlit && (
                <>
                    {welcomeReady &&
                    (freeShippingNudge?.enabled === true ||
                        freeShippingNudge?.enabled === 'true') ? (
                        <CartNudge
                            config={freeShippingNudge}
                            siteId={siteId}
                            position={position}
                            demoMode={
                                welcomeMessageDemoMode === true || welcomeMessageDemoMode === 'true'
                            }
                            onDismiss={() => launcherRef.current?.focus()}
                            fallback={welcomeNudge}
                        />
                    ) : (
                        welcomeNudge
                    )}
                </>
            )}
            <IconButton
                ref={launcherRef}
                data-testid="commerce-client-fab"
                aria-label={intl.formatMessage({
                    id: 'header.button.assistive_msg.ask_shopping_agent',
                    defaultMessage: 'Ask Shopping Agent'
                })}
                icon={<SparkleIcon boxSize={6} />}
                onClick={() => {
                    const message = isSpotlit
                        ? getSpotlightMessage(spotlightType, pathname, search)
                        : ''
                    setIsSpotlit(false)
                    openCommerceClientWidget(true)
                    if (message) sendCommerceClientMessage(message)
                }}
                position="fixed"
                bottom={6}
                {...(isLeft ? {left: 6} : {right: 6})}
                zIndex="sticky"
                transform={isSpotlit ? spotlightTransform : 'none'}
                transition="transform 0.8s ease-in-out"
                sx={{'@media (prefers-reduced-motion: reduce)': {transition: 'none'}}}
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
