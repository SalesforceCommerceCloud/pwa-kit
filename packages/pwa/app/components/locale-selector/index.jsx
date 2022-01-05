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
} from '../icons'

import LocaleText from '../locale-text'

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
const LocaleSelector = ({selectedLocale = '', locales = [], onSelect = () => {}, ...props}) => {
    const styles = useStyleConfig('LocaleSelector')
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
                                <LocaleText {...styles.selectedText} shortCode={selectedLocale} />
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
                                                <LocaleText
                                                    {...styles.optionText}
                                                    shortCode={locale}
                                                />

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
    locales: PropTypes.arrayOf(PropTypes.string).isRequired,
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
