import React, {useState, useContext} from 'react'
import PropTypes from 'prop-types'
import {IntlProvider as ReactIntlProvider} from 'react-intl'
import packageInfo from '../package.json'

// TODO: You can update these locales in 'pwa/package.json' file
export const SUPPORTED_LOCALES = packageInfo.l10n.supportedLocales
export const DEFAULT_LOCALE = packageInfo.l10n.defaultLocale

/**
 * Dynamically import the translations/messages for a given locale
 * @param {string} locale - The locale code
 * @returns {Promise<Object>} The messages (compiled in AST format) in the given locale. If locale is not found, returns the default locale's messages.
 */
export const loadLocaleData = async (locale) => {
    // NOTE: the pseudo locale in this case is actually `en-XB` from react-intl. For more details:
    // - see our npm script `compile-messages:pseudo`
    // - and this react-intl PR: https://github.com/formatjs/formatjs/pull/2708
    const locales = [...SUPPORTED_LOCALES, 'pseudo']
    let localeToLoad

    if (locales.includes(locale)) {
        localeToLoad = locale
    } else {
        console.warn(
            `Not expecting to see locale '${locale}'. Loading the default locale '${DEFAULT_LOCALE}' instead.`
        )
        localeToLoad = DEFAULT_LOCALE
    }

    let module
    try {
        module = await import(`./translations/compiled/${localeToLoad}.json`)
    } catch (err) {
        console.error(err)
        console.log(`Loading the default locale '${DEFAULT_LOCALE}' instead`)
        module = await import(`./translations/compiled/${DEFAULT_LOCALE}.json`)
    }

    return module.default
}

/**
 * Get all of the locale-related configuration data
 * @param {Object} options
 * @param {function} [options.getUserPreferredLocales] - Identify what set of locales the user prefers
 * @returns {Promise<Object>} The configuration data
 */
export const getLocaleConfig = async ({getUserPreferredLocales} = {}) => {
    const preferredLocales = getUserPreferredLocales ? getUserPreferredLocales() : [DEFAULT_LOCALE]
    const targetLocale = getTargetLocale(preferredLocales, SUPPORTED_LOCALES, DEFAULT_LOCALE)
    const messages = await loadLocaleData(targetLocale)

    return {
        app: {
            supportedLocales: SUPPORTED_LOCALES,
            defaultLocale: DEFAULT_LOCALE,
            targetLocale
        },
        user: {
            preferredLocales
        },
        messages
    }
}

/**
 * Decide which locale to load
 * @param {string[]} preferredLocales - All locales that the user prefers
 * @param {string[]} supportedLocales - All locales that your app supports
 * @param {string} fallbackLocale - App's default locale
 * @returns {string} The target locale if there's a match. Otherwise, returns `fallbackLocale`.
 */
export const whichLocaleToLoad = (preferredLocales, supportedLocales, fallbackLocale) => {
    const targetLocale = preferredLocales
        .map((locale) => locale.toLowerCase())
        .filter((locale) => supportedLocales.includes(locale))[0]

    return targetLocale || fallbackLocale
}

/**
 * Get the target locale
 * @param {string[]} preferredLocales - All locales that the user prefers
 * @param {string[]} supportedLocales - All locales that your app supports
 * @param {string} defaultLocale - App's default locale
 * @returns {string} Either `TARGET_LOCALE` environment variable if it's set OR the calculated target locale
 */
export const getTargetLocale = (preferredLocales, supportedLocales, defaultLocale) => {
    return (
        process.env.TARGET_LOCALE ||
        whichLocaleToLoad(preferredLocales, supportedLocales, defaultLocale)
    )
}

const LocaleContext = React.createContext()

export const IntlProvider = ({children, locale, messages, ...otherProps}) => {
    const [activeLocale, setActiveLocale] = useState(locale)
    const [activeMessages, setActiveMessages] = useState(messages)

    // NOTE: if changing locale this way causes some issue in your app, you may want to
    // consider doing it with a page refresh instead (by setting `window.location` with a localized URL)
    const changeLocale = async (locale) => {
        const newMessages = await loadLocaleData(locale)
        setActiveMessages(newMessages)
        setActiveLocale(locale)
    }

    return (
        <ReactIntlProvider locale={activeLocale} messages={activeMessages} {...otherProps}>
            <LocaleContext.Provider value={{activeLocale, changeLocale}}>
                {children}
            </LocaleContext.Provider>
        </ReactIntlProvider>
    )
}
IntlProvider.propTypes = {
    children: PropTypes.node,
    locale: PropTypes.string,
    messages: PropTypes.object
}

/**
 * Custom React hook to get the currently active locale and to change it to a different locale
 * @returns {{activeLocale: string, changeLocale: function}[]}
 */
export const useLocale = () => {
    const {activeLocale, changeLocale} = useContext(LocaleContext)
    return [activeLocale, changeLocale]
}
