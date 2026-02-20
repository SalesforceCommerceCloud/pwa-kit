/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage} from 'react-intl'
import {SparkleIcon, ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'

const AskAssistantBanner = ({onClick, styles}) => {
    return (
        <Box
            {...styles.askAssistantBanner}
            as="button"
            type="button"
            width="full"
            textAlign="left"
            onClick={onClick}
            aria-label="Ask Assistant - Discover, compare and shop smarter with your personal shopping assistant"
        >
            <Box {...styles.askAssistantBannerContent}>
                <Box {...styles.askAssistantBannerIcon} as={SparkleIcon} boxSize={6} />
                <Box>
                    <Text {...styles.askAssistantBannerTitle}>
                        <FormattedMessage
                            defaultMessage="Ask Shopping Agent"
                            id="search.suggestions.askAssistant.title"
                        />
                    </Text>
                    <Text {...styles.askAssistantBannerDescription}>
                        <FormattedMessage
                            defaultMessage="Discover, compare, and shop smarter with your personal Shopping Agent."
                            id="search.suggestions.askAssistant.description"
                        />
                    </Text>
                </Box>
            </Box>
            <Box {...styles.askAssistantBannerArrow} as={ChevronRightIcon} boxSize={5} />
        </Box>
    )
}

AskAssistantBanner.propTypes = {
    onClick: PropTypes.func.isRequired,
    styles: PropTypes.object.isRequired
}

export default AskAssistantBanner
