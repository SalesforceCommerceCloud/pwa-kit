/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {keyframes} from '@emotion/react'
import {Box, Portal} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SparkleFilledIcon} from '@salesforce/retail-react-app/app/components/icons'
import {COMMERCE_CLIENT_UI_STATE_EVENT} from '@salesforce/retail-react-app/app/constants'
import {
    getPersistedCommerceClientOpenState,
    openCommerceClientWidget
} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

const onClient = typeof window !== 'undefined'

const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'

const ccFabSheen = keyframes`
    0% { opacity: 0; transform: translateX(0) skewX(-13deg); }
    15% { opacity: 1; }
    85% { opacity: 1; transform: translateX(310px) skewX(-13deg); }
    100% { opacity: 0; transform: translateX(310px) skewX(-13deg); }
`

const usePrefersReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        if (!onClient) return undefined
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mql.matches)
        const handler = (e) => setPrefersReducedMotion(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    return prefersReducedMotion
}

// Animation timing (ms) — matches the SFRA plugin_commerce_client reference.
const COLLAPSE_DELAY = 1000
const EXPAND_DELAY = 5200
const SHEEN_DELAY = 6000
const LOOP_DELAY = 7100

const useFabAnimation = (isVisible, prefersReducedMotion) => {
    const [isExpanded, setIsExpanded] = useState(true)
    const [showSheen, setShowSheen] = useState(false)
    const timersRef = useRef([])
    const interactingRef = useRef(false)
    const cycleRef = useRef({})

    useEffect(() => {
        if (!isVisible || !onClient) {
            setIsExpanded(true)
            setShowSheen(false)
            return undefined
        }

        interactingRef.current = false

        const cancelTimers = () => {
            timersRef.current.forEach(clearTimeout)
            timersRef.current = []
        }
        const scheduleTimer = (cb, delay) => {
            timersRef.current.push(setTimeout(cb, delay))
        }

        const holdExpanded = () => {
            cancelTimers()
            setShowSheen(false)
            setIsExpanded(true)
        }

        const startCollapsedPhase = () => {
            cancelTimers()
            setShowSheen(false)
            if (prefersReducedMotion) {
                setIsExpanded(true)
                return
            }
            setIsExpanded(false)
            scheduleTimer(() => setIsExpanded(true), EXPAND_DELAY)
            scheduleTimer(() => setShowSheen(true), SHEEN_DELAY)
            scheduleTimer(() => startExpandedPhase(), LOOP_DELAY)
        }

        const startExpandedPhase = () => {
            holdExpanded()
            if (!prefersReducedMotion) {
                scheduleTimer(() => {
                    if (!interactingRef.current) startCollapsedPhase()
                }, COLLAPSE_DELAY)
            }
        }

        cycleRef.current = {holdExpanded, startCollapsedPhase}
        startExpandedPhase()

        return cancelTimers
    }, [isVisible, prefersReducedMotion])

    const onInteractionStart = useCallback(() => {
        interactingRef.current = true
        cycleRef.current.holdExpanded?.()
    }, [])

    const onInteractionEnd = useCallback(() => {
        interactingRef.current = false
        cycleRef.current.startCollapsedPhase?.()
    }, [])

    return {isExpanded, showSheen, onInteractionStart, onInteractionEnd}
}

/**
 * Floating action button that opens the Commerce Client shopping agent.
 *
 * Renders as an expandable pill that cycles between icon-only and
 * icon+label states with a sheen sweep, matching the SFRA reference.
 * Hides itself while the agent panel is open.
 */
const CommerceClientFab = ({
    position = 'bottom-right',
    isPanelOpenByDefault = false,
    ariaLabel,
    fabLabel
}) => {
    const intl = useIntl()
    const [isPanelOpen, setIsPanelOpen] = useState(isPanelOpenByDefault)
    const prefersReducedMotion = usePrefersReducedMotion()
    const isVisible = !isPanelOpen
    const {isExpanded, showSheen, onInteractionStart, onInteractionEnd} = useFabAnimation(
        isVisible,
        prefersReducedMotion
    )

    useEffect(() => {
        if (!onClient) return undefined

        const persistedOpen = getPersistedCommerceClientOpenState()
        if (persistedOpen !== undefined) {
            setIsPanelOpen(persistedOpen)
        }

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

    if (isPanelOpen) {
        return null
    }

    const label =
        fabLabel ||
        intl.formatMessage({
            id: 'header.button.assistive_msg.ask_shopping_agent',
            defaultMessage: 'Ask Shopping Agent'
        })

    const accessibleLabel = ariaLabel || label

    const noTransition = prefersReducedMotion ? 'none' : undefined

    return (
        <Portal>
            <Box
                as="button"
                type="button"
                data-testid="commerce-client-fab"
                aria-label={accessibleLabel}
                onClick={() => openCommerceClientWidget(true)}
                onMouseEnter={onInteractionStart}
                onMouseLeave={onInteractionEnd}
                onFocus={onInteractionStart}
                onBlur={onInteractionEnd}
                position="fixed"
                bottom={6}
                {...(position === 'bottom-left' ? {left: 6} : {right: 6})}
                zIndex="sticky"
                display="inline-flex"
                alignItems="center"
                justifyContent="flex-start"
                height="56px"
                minWidth="56px"
                maxWidth={isExpanded ? '320px' : '56px'}
                overflow="hidden"
                borderRadius="28px"
                bg="#1c1d22"
                color="white"
                border="none"
                cursor="pointer"
                whiteSpace="nowrap"
                padding="0 14px"
                paddingRight={isExpanded ? '24px' : '14px'}
                fontFamily="Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                fontSize="13px"
                fontWeight={650}
                lineHeight={1}
                letterSpacing="-0.15px"
                boxShadow="0 8px 18px rgba(16,17,22,0.24), 0 2px 4px rgba(16,17,22,0.18)"
                transition={
                    noTransition ||
                    `max-width 0.6s ${EASE_OUT_EXPO}, padding-right 0.6s ${EASE_OUT_EXPO}`
                }
                sx={{
                    '&:focus-visible': {
                        outline: '3px solid #0176d3',
                        outlineOffset: '3px',
                        maxWidth: '320px',
                        paddingRight: '24px'
                    },
                    '&:active': {
                        opacity: 0.85
                    }
                }}
            >
                {/* Sheen sweep overlay */}
                {showSheen && (
                    <Box
                        position="absolute"
                        zIndex={2}
                        top="-9px"
                        left="-72px"
                        width="58px"
                        height="74px"
                        pointerEvents="none"
                        background="linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.56) 50%, rgba(255,255,255,0.06) 70%, transparent)"
                        filter="blur(7px)"
                        sx={{
                            animation: `${ccFabSheen} 0.6s linear`
                        }}
                        data-testid="commerce-client-fab-sheen"
                    />
                )}

                {/* Icon */}
                <Box
                    as="span"
                    position="relative"
                    zIndex={1}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flex="0 0 auto"
                    transition={noTransition || `transform 0.6s ${EASE_OUT_EXPO}`}
                    transform={isExpanded ? 'translateX(3px)' : 'translateX(0)'}
                >
                    <SparkleFilledIcon boxSize={5} />
                </Box>

                {/* Label */}
                <Box
                    as="span"
                    position="relative"
                    zIndex={1}
                    flex="0 0 auto"
                    marginLeft={isExpanded ? '10px' : '0'}
                    opacity={isExpanded ? 1 : 0}
                    transform={isExpanded ? 'translateX(0)' : 'translateX(8px)'}
                    transition={
                        noTransition ||
                        `margin-left 0.6s ${EASE_OUT_EXPO}, opacity 0.4s ease, transform 0.6s ${EASE_OUT_EXPO}`
                    }
                    data-testid="commerce-client-fab-label"
                >
                    {label}
                </Box>
            </Box>
        </Portal>
    )
}

CommerceClientFab.propTypes = {
    position: PropTypes.oneOf(['bottom-left', 'bottom-right']),
    isPanelOpenByDefault: PropTypes.bool,
    ariaLabel: PropTypes.string,
    fabLabel: PropTypes.string
}

export default CommerceClientFab
