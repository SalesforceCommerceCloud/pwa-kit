/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

// Components
import {
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    Box,
    Text,

    // Hooks
    useStyleConfig
} from '@chakra-ui/react'

// Icons
import {
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    FlagGBIcon,
    FlagFRIcon,
    FlagITIcon,
    FlagCNIcon,
    FlagJPIcon
} from '../../components/icons'

import {defaultLocaleMessages} from '../_app'
import {DEFAULT_LOCALE} from '../../constants'
import {useIntl} from 'react-intl'

// NOTE: If you want to have flags shown next to a selectable locale, update this
// mapping object with the short code as the key for the desired icon.
const flags = {
    'en-GB': <FlagGBIcon />,
    'fr-FR': <FlagFRIcon />,
    'it-IT': <FlagITIcon />,
    'zh-CN': <FlagCNIcon />,
    'ja-JP': <FlagJPIcon />
}

/**
 * The Locale Selector is a disclosure in the form of an accordion. It is
 * populated with all the supported locales for the application allowing the
 * user to change the current locale.
 */
const LocaleSelector = ({
    selectedLocale = DEFAULT_LOCALE,
    locales = [],
    onSelect = () => {},
    ...props
}) => {
    const styles = useStyleConfig('LocaleSelector')
    const intl = useIntl()

    return (
        <Box className="sf-locale-selector">
            <Accordion allowToggle={true} {...props}>
                <AccordionItem border="none">
                    {({isExpanded}) => (
                        <>
                            <AccordionButton {...styles.selectedButton}>
                                {/* Replace default expanded/collapsed icons. */}
                                {isExpanded ? (
                                    <ChevronDownIcon {...styles.selectedButtonIcon} />
                                ) : (
                                    <ChevronRightIcon {...styles.selectedButtonIcon} />
                                )}
                                {/* Display flag icon if one exists */}
                                {flags[selectedLocale]}
                                <Text {...styles.selectedText}>
                                    {intl.formatMessage(defaultLocaleMessages[selectedLocale])}
                                </Text>
                            </AccordionButton>
                            <AccordionPanel>
                                <Accordion allowToggle={true} {...styles.accordion}>
                                    {locales.map((locale) => (
                                        <AccordionItem border="none" key={locale}>
                                            <AccordionButton
                                                {...styles.optionButton}
                                                onClick={() => onSelect(locale)}
                                            >
                                                {/* Display flag icon if one exists */}
                                                {flags[locale]}

                                                {/* Locale name */}
                                                <Text {...styles.optionText}>
                                                    {intl.formatMessage(
                                                        defaultLocaleMessages[locale]
                                                    )}
                                                </Text>

                                                {/* Selection indicator */}
                                                {selectedLocale === locale && (
                                                    <CheckIcon {...styles.selectedIcon} />
                                                )}
                                            </AccordionButton>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </AccordionPanel>
                        </>
                    )}
                </AccordionItem>
            </Accordion>
        </Box>
    )
}

LocaleSelector.displayName = 'LocaleSelector'

LocaleSelector.propTypes = {
    /**
     * A complete list of all the locales supported. This array must have content.
     */
    locales: PropTypes.array.isRequired,
    /**
     * The current locales shortcode.
     */
    selectedLocale: PropTypes.string.isRequired,
    /**
     * Function called when a locale is selected.
     */
    onSelect: PropTypes.func
}

export default LocaleSelector
