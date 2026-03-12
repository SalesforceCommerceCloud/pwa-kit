/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef} from 'react'
import PropTypes from 'prop-types'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import {SparkleIcon, ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'

const AskAssistantBanner = ({onClick, styles}) => {
    const intl = useIntl()
    const handledByTouchRef = useRef(false)
    const title = intl.formatMessage({
        id: 'search.suggestions.askAssistant.title',
        defaultMessage: 'Ask Shopping Agent'
    })
    const description = intl.formatMessage({
        id: 'search.suggestions.askAssistant.description',
        defaultMessage: 'Discover, compare, and shop smarter with your personal Shopping Agent.'
    })
    const ariaLabel = `${title} - ${description}`

    const handleInteraction = (e) => {
        e.preventDefault()
        onClick?.()
    }

    const handleTouchStart = (e) => {
        // Prevent the search input from blurring when the user touches the banner.
        // Otherwise onBlur closes the overlay before touchEnd/click fires, so the tap never runs.
        e.preventDefault()
    }

    const handleTouchEnd = () => {
        handledByTouchRef.current = true
        onClick?.()
        setTimeout(() => {
            handledByTouchRef.current = false
        }, 400)
    }

    const handleClick = (e) => {
        if (handledByTouchRef.current) {
            return
        }
        handleInteraction(e)
    }

    return (
        <Box
            {...styles.askAssistantBanner}
            as="button"
            type="button"
            textAlign="left"
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-label={ariaLabel}
        >
            <Box {...styles.askAssistantBannerIcon}>
                <SparkleIcon boxSize={5} color="gray.800" />
            </Box>
            <Box {...styles.askAssistantBannerContent}>
                <Box {...styles.askAssistantBannerTitleRow}>
                    <Text {...styles.askAssistantBannerTitle}>{title}</Text>
                    <Box {...styles.askAssistantBannerArrow}>
                        <ChevronRightIcon boxSize={5} color="gray.800" />
                    </Box>
                </Box>
                <Text {...styles.askAssistantBannerDescription}>{description}</Text>
            </Box>
        </Box>
    )
}

AskAssistantBanner.propTypes = {
    onClick: PropTypes.func.isRequired,
    styles: PropTypes.object.isRequired
}

export default AskAssistantBanner
