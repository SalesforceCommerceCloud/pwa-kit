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
    Box,
    Text,

    // Hooks
    useSlotRecipe
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

import LocaleText from '../../components/locale-text'

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
    const recipe = useSlotRecipe({key: 'localeSelector'})
    const styles = recipe()

    return (
        <Box className="sf-locale-selector">
            <Accordion.Root collapsible {...props}>
                <Accordion.Item border="none">
                    <Accordion.ItemContext>
                        {({expanded}) => (
                            <>
                                <Accordion.ItemTrigger css={styles.selectedButton}>
                                    {/* Replace default expanded/collapsed icons. */}
                                    {expanded ? (
                                        <ChevronDownIcon css={styles.selectedButtonIcon} />
                                    ) : (
                                        <ChevronRightIcon css={styles.selectedButtonIcon} />
                                    )}
                                    {/* Display flag icon if one exists */}
                                    {flags[selectedLocale]}
                                    <Text css={styles.selectedText}>
                                        <LocaleText shortCode={selectedLocale} />
                                    </Text>
                                </Accordion.ItemTrigger>
                                <Accordion.ItemContent>
                                    <Accordion.Root multiple css={styles.accordion}>
                                        {locales.map((locale) => (
                                            <Accordion.Item border="none" key={locale}>
                                                <Accordion.ItemTrigger
                                                    css={styles.optionButton}
                                                    onClick={() => onSelect(locale)}
                                                >
                                                    {/* Display flag icon if one exists */}
                                                    {flags[locale]}

                                                    {/* Locale name */}
                                                    <Text css={styles.optionText}>
                                                        <LocaleText shortCode={locale} />
                                                    </Text>

                                                    {/* Selection indicator */}
                                                    {selectedLocale === locale && (
                                                        <CheckIcon css={styles.selectedIcon} />
                                                    )}
                                                </Accordion.ItemTrigger>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion.Root>
                                </Accordion.ItemContent>
                            </>
                        )}
                    </Accordion.ItemContext>
                </Accordion.Item>
            </Accordion.Root>
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
