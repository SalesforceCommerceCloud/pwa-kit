/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {defineMessage, defineMessages, useIntl} from 'react-intl'
import {chakra, Text} from '@chakra-ui/react'

const LocaleText = ({shortCode, as, ...otherProps}) => {
    const intl = useIntl()
    const Wrapper = as ? chakra(as) : Text
    const message = LOCALE_MESSAGES[shortCode] || FALLBACK_MESSAGE

    if (message === FALLBACK_MESSAGE) {
        console.error(
            `No locale message found for "${shortCode}". Please update the list accordingly.`
        )
    }

    return (
        <Wrapper {...otherProps}>
            {intl.formatMessage(message, {localeShortCode: shortCode})}
        </Wrapper>
    )
}

LocaleText.displayName = 'LocaleText'

LocaleText.propTypes = {
    /**
     * The locale shortcode that you would like the localized text for.
     */
    shortCode: PropTypes.string.isRequired,
    /**
     * The element type to render this component as, defaults to a Text component.
     */
    as: PropTypes.string
}

export default LocaleText

const FALLBACK_MESSAGE = defineMessage({defaultMessage: 'Unknown {localeShortCode}'})

/**
 *  Translations for names of the commonly-used locales.
 *  `locale` parameter format for OCAPI and Commerce API: <language code>-<country code>
 *  https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/Localization.html
 */
const LOCALE_MESSAGES = defineMessages({
    'ar-SA': {defaultMessage: 'Arabic (Saudi Arabia)'},
    'bn-BD': {defaultMessage: 'Bangla (Bangladesh)'},
    'bn-IN': {defaultMessage: 'Bangla (India)'},
    'cs-CZ': {defaultMessage: 'Czech (Czech Republic)'},
    'da-DK': {defaultMessage: 'Danish (Denmark)'},
    'de-AT': {defaultMessage: 'German (Austria)'},
    'de-CH': {defaultMessage: 'German (Switzerland)'},
    'de-DE': {defaultMessage: 'German (Germany)'},
    'el-GR': {defaultMessage: 'Greek (Greece)'},
    'en-AU': {defaultMessage: 'English (Australia)'},
    'en-CA': {defaultMessage: 'English (Canada)'},
    'en-GB': {defaultMessage: 'English (United Kingdom)'},
    'en-IE': {defaultMessage: 'English (Ireland)'},
    'en-IN': {defaultMessage: 'English (India)'},
    'en-NZ': {defaultMessage: 'English (New Zealand)'},
    'en-US': {defaultMessage: 'English (United States)'},
    'en-ZA': {defaultMessage: 'English (South Africa)'},
    'es-AR': {defaultMessage: 'Spanish (Argentina)'},
    'es-CL': {defaultMessage: 'Spanish (Chile)'},
    'es-CO': {defaultMessage: 'Spanish (Columbia)'},
    'es-ES': {defaultMessage: 'Spanish (Spain)'},
    'es-MX': {defaultMessage: 'Spanish (Mexico)'},
    'es-US': {defaultMessage: 'Spanish (United States)'},
    'fi-FI': {defaultMessage: 'Finnish (Finland)'},
    'fr-BE': {defaultMessage: 'French (Belgium)'},
    'fr-CA': {defaultMessage: 'French (Canada)'},
    'fr-CH': {defaultMessage: 'French (Switzerland)'},
    'fr-FR': {defaultMessage: 'French (France)'},
    'he-IL': {defaultMessage: 'Hebrew (Israel)'},
    'hi-IN': {defaultMessage: 'Hindi (India)'},
    'hu-HU': {defaultMessage: 'Hungarian (Hungary)'},
    'id-ID': {defaultMessage: 'Indonesian (Indonesia)'},
    'it-CH': {defaultMessage: 'Italian (Switzerland)'},
    'it-IT': {defaultMessage: 'Italian (Italy)'},
    'ja-JP': {defaultMessage: 'Japanese (Japan)'},
    'ko-KR': {defaultMessage: 'Korean (Republic of Korea)'},
    'nl-BE': {defaultMessage: 'Dutch (Belgium)'},
    'nl-NL': {defaultMessage: 'Dutch (The Netherlands)'},
    'no-NO': {defaultMessage: 'Norwegian (Norway)'},
    'pl-PL': {defaultMessage: 'Polish (Poland)'},
    'pt-BR': {defaultMessage: 'Portuguese (Brazil)'},
    'pt-PT': {defaultMessage: 'Portuguese (Portugal)'},
    'ro-RO': {defaultMessage: 'Romanian (Romania)'},
    'ru-RU': {defaultMessage: 'Russian (Russian Federation)'},
    'sk-SK': {defaultMessage: 'Slovak (Slovakia)'},
    'sv-SE': {defaultMessage: 'Swedish (Sweden)'},
    'ta-IN': {defaultMessage: 'Tamil (India)'},
    'ta-LK': {defaultMessage: 'Tamil (Sri Lanka)'},
    'th-TH': {defaultMessage: 'Thai (Thailand)'},
    'tr-TR': {defaultMessage: 'Turkish (Turkey)'},
    'zh-CN': {defaultMessage: 'Chinese (China)'},
    'zh-HK': {defaultMessage: 'Chinese (Hong Kong)'},
    'zh-TW': {defaultMessage: 'Chinese (Taiwan)'}
})
