/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {IconButton, Portal} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import {COMMERCE_CLIENT_UI_STATE_EVENT} from '@salesforce/retail-react-app/app/constants'
import {
    getPersistedCommerceClientOpenState,
    openCommerceClientWidget
} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

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
const CommerceClientFab = ({position = 'bottom-right', isPanelOpenByDefault = false}) => {
    const intl = useIntl()
    const [isPanelOpen, setIsPanelOpen] = useState(isPanelOpenByDefault)

    useEffect(() => {
        if (!onClient) return undefined

        // sessionStorage is SSR-unsafe, so the persisted state is reconciled on mount.
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

    return (
        <Portal>
            <IconButton
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
    isPanelOpenByDefault: PropTypes.bool
}

export default CommerceClientFab
