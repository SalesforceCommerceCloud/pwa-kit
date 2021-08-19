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
    FlagCanIcon,
    FlagUsaIcon
} from '../../components/icons'

// NOTE: If you want to have flags shown nect to a selecable locale, update this
// mapping object with the short code as the key for the desired icon.
const flags = {
    'en-CA': <FlagCanIcon />,
    'fr-CA': <FlagCanIcon />,
    'en-US': <FlagUsaIcon />
}

/**
 * The Locale Selector is a disclosure in the form of an accordion. It is
 * populated with all the suported locales for the application allowing the
 * user to change the current locale.
 */
const LocaleSelector = ({
    selectedLocale = 'en-US',
    locales = [],
    onSelect = () => {},
    ...props
}) => {
    const styles = useStyleConfig('LocaleSelector')
    const selectedLocaleObject = locales.find(({shortCode}) => shortCode === selectedLocale)

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

                                {selectedLocaleObject && (
                                    <Text {...styles.selectedText}>
                                        {selectedLocaleObject.name}
                                    </Text>
                                )}
                            </AccordionButton>
                            <AccordionPanel>
                                <Accordion allowToggle={true} {...styles.accordion}>
                                    {locales.map(({name, shortCode}) => (
                                        <AccordionItem border="none" key={shortCode}>
                                            <AccordionButton
                                                {...styles.optionButton}
                                                onClick={() => onSelect(shortCode)}
                                            >
                                                {/* Display flag icon if one exists */}
                                                {flags[shortCode]}

                                                {/* Locale name */}
                                                <Text {...styles.optionText}>{name}</Text>

                                                {/* Selection indicator */}
                                                {selectedLocale === shortCode && (
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
