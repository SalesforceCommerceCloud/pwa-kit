/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {Text} from '@chakra-ui/layout'
import React from 'react'
import {FormattedMessage, defineMessages, useIntl, defineMessage} from 'react-intl'

const LocaleSelectorText = ({localeId, asDropdownOption = false, ...otherProps}) => {
    const found = LOCALE_MESSAGES[localeId]
    const intl = useIntl()

    if (found) {
        return asDropdownOption ? (
            <option value={localeId} {...otherProps}>
                {intl.formatMessage(found)}
            </option>
        ) : (
            <Text {...otherProps}>
                <FormattedMessage {...found} />
            </Text>
        )
    } else {
        console.error(
            `No locale message found for "${localeId}". Please update the list accordingly.`
        )

        return asDropdownOption ? (
            <option value={localeId} {...otherProps}>
                {intl.formatMessage(FALLBACK_MESSAGE, {localeId})}
            </option>
        ) : (
            <Text {...otherProps}>
                <FormattedMessage {...FALLBACK_MESSAGE} values={{localeId}} />
            </Text>
        )
    }
}
// TODO: prop type
// TODO: add tests
// TODO: clean up old code

export default LocaleSelectorText

const FALLBACK_MESSAGE = defineMessage({defaultMessage: 'Unknown {localeId}'})

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
