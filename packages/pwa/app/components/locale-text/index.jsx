/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {defineMessages, useIntl} from 'react-intl'
import {chakra, Text} from '@chakra-ui/react'

const LocaleText = ({shortCode, as, ...otherProps}) => {
    const intl = useIntl()
    const Wrapper = as ? chakra(as) : Text
    const message = LOCALE_MESSAGES[shortCode]

    if (!message) {
        console.error(
            `No locale message found for "${shortCode}". Please update the list accordingly.`
        )
        return <Wrapper {...otherProps}>Unknown {shortCode}</Wrapper>
    }

    return <Wrapper {...otherProps}>{intl.formatMessage(message)}</Wrapper>
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

/**
 *  Translations for names of the commonly-used locales.
 *  `locale` parameter format for OCAPI and Commerce API: <language code>-<country code>
 *  https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/Localization.html
 */
// TODO: do we want to localize this?
const LOCALE_MESSAGES = defineMessages({
    'ar-SA': {id: 'locale_text.message.ar-SA', defaultMessage: 'Arabic (Saudi Arabia)'},
    'bn-BD': {id: 'locale_text.message.bn-BD', defaultMessage: 'Bangla (Bangladesh)'},
    'bn-IN': {id: 'locale_text.message.bn-IN', defaultMessage: 'Bangla (India)'},
    'cs-CZ': {id: 'locale_text.message.cs-CZ', defaultMessage: 'Czech (Czech Republic)'},
    'da-DK': {id: 'locale_text.message.da-DK', defaultMessage: 'Danish (Denmark)'},
    'de-AT': {id: 'locale_text.message.de-AT', defaultMessage: 'German (Austria)'},
    'de-CH': {id: 'locale_text.message.de-CH', defaultMessage: 'German (Switzerland)'},
    'de-DE': {id: 'locale_text.message.de-DE', defaultMessage: 'German (Germany)'},
    'el-GR': {id: 'locale_text.message.el-GR', defaultMessage: 'Greek (Greece)'},
    'en-AU': {id: 'locale_text.message.en-AU', defaultMessage: 'English (Australia)'},
    'en-CA': {id: 'locale_text.message.en-CA', defaultMessage: 'English (Canada)'},
    'en-GB': {id: 'locale_text.message.en-GB', defaultMessage: 'English (United Kingdom)'},
    'en-IE': {id: 'locale_text.message.en-IE', defaultMessage: 'English (Ireland)'},
    'en-IN': {id: 'locale_text.message.en-IN', defaultMessage: 'English (India)'},
    'en-NZ': {id: 'locale_text.message.en-NZ', defaultMessage: 'English (New Zealand)'},
    'en-US': {id: 'locale_text.message.en-US', defaultMessage: 'English (United States)'},
    'en-ZA': {id: 'locale_text.message.en-ZA', defaultMessage: 'English (South Africa)'},
    'es-AR': {id: 'locale_text.message.es-AR', defaultMessage: 'Spanish (Argentina)'},
    'es-CL': {id: 'locale_text.message.es-CL', defaultMessage: 'Spanish (Chile)'},
    'es-CO': {id: 'locale_text.message.es-CO', defaultMessage: 'Spanish (Columbia)'},
    'es-ES': {id: 'locale_text.message.es-ES', defaultMessage: 'Spanish (Spain)'},
    'es-MX': {id: 'locale_text.message.es-MX', defaultMessage: 'Spanish (Mexico)'},
    'es-US': {id: 'locale_text.message.es-US', defaultMessage: 'Spanish (United States)'},
    'fi-FI': {id: 'locale_text.message.fi-FI', defaultMessage: 'Finnish (Finland)'},
    'fr-BE': {id: 'locale_text.message.fr-BE', defaultMessage: 'French (Belgium)'},
    'fr-CA': {id: 'locale_text.message.fr-CA', defaultMessage: 'French (Canada)'},
    'fr-CH': {id: 'locale_text.message.fr-CH', defaultMessage: 'French (Switzerland)'},
    'fr-FR': {id: 'locale_text.message.fr-FR', defaultMessage: 'French (France)'},
    'he-IL': {id: 'locale_text.message.he-IL', defaultMessage: 'Hebrew (Israel)'},
    'hi-IN': {id: 'locale_text.message.hi-IN', defaultMessage: 'Hindi (India)'},
    'hu-HU': {id: 'locale_text.message.hu-HU', defaultMessage: 'Hungarian (Hungary)'},
    'id-ID': {id: 'locale_text.message.id-ID', defaultMessage: 'Indonesian (Indonesia)'},
    'it-CH': {id: 'locale_text.message.it-CH', defaultMessage: 'Italian (Switzerland)'},
    'it-IT': {id: 'locale_text.message.it-IT', defaultMessage: 'Italian (Italy)'},
    'ja-JP': {id: 'locale_text.message.ja-JP', defaultMessage: 'Japanese (Japan)'},
    'ko-KR': {id: 'locale_text.message.ko-KR', defaultMessage: 'Korean (Republic of Korea)'},
    'nl-BE': {id: 'locale_text.message.nl-BE', defaultMessage: 'Dutch (Belgium)'},
    'nl-NL': {id: 'locale_text.message.nl-NL', defaultMessage: 'Dutch (The Netherlands)'},
    'no-NO': {id: 'locale_text.message.no-NO', defaultMessage: 'Norwegian (Norway)'},
    'pl-PL': {id: 'locale_text.message.pl-PL', defaultMessage: 'Polish (Poland)'},
    'pt-BR': {id: 'locale_text.message.pt-BR', defaultMessage: 'Portuguese (Brazil)'},
    'pt-PT': {id: 'locale_text.message.pt-PT', defaultMessage: 'Portuguese (Portugal)'},
    'ro-RO': {id: 'locale_text.message.ro-RO', defaultMessage: 'Romanian (Romania)'},
    'ru-RU': {id: 'locale_text.message.ru-RU', defaultMessage: 'Russian (Russian Federation)'},
    'sk-SK': {id: 'locale_text.message.sk-SK', defaultMessage: 'Slovak (Slovakia)'},
    'sv-SE': {id: 'locale_text.message.sv-SE', defaultMessage: 'Swedish (Sweden)'},
    'ta-IN': {id: 'locale_text.message.ta-IN', defaultMessage: 'Tamil (India)'},
    'ta-LK': {id: 'locale_text.message.ta-LK', defaultMessage: 'Tamil (Sri Lanka)'},
    'th-TH': {id: 'locale_text.message.th-TH', defaultMessage: 'Thai (Thailand)'},
    'tr-TR': {id: 'locale_text.message.tr-TR', defaultMessage: 'Turkish (Turkey)'},
    'zh-CN': {id: 'locale_text.message.zh-CN', defaultMessage: 'Chinese (China)'},
    'zh-HK': {id: 'locale_text.message.zh-HK', defaultMessage: 'Chinese (Hong Kong)'},
    'zh-TW': {id: 'locale_text.message.zh-TW', defaultMessage: 'Chinese (Taiwan)'}
})
