/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef, useContext} from 'react'
import {defineMessage, IntlContext} from 'react-intl'
import PropTypes from 'prop-types'
import {Icon, useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'

// Our own SVG imports. These will be extracted to a single sprite sheet by the
// svg-sprite-loader webpack plugin at build time and injected in the <body> tag
// during SSR.
// NOTE: Another solution would be to use `require-context.macro` package to accomplish
// importing icon svg's.
import '@salesforce/retail-react-app/app/assets/svg/alert.svg'
import '@salesforce/retail-react-app/app/assets/svg/account.svg'
import '@salesforce/retail-react-app/app/assets/svg/basket.svg'
import '@salesforce/retail-react-app/app/assets/svg/check.svg'
import '@salesforce/retail-react-app/app/assets/svg/check-circle.svg'
import '@salesforce/retail-react-app/app/assets/svg/chevron-up.svg'
import '@salesforce/retail-react-app/app/assets/svg/chevron-down.svg'
import '@salesforce/retail-react-app/app/assets/svg/chevron-right.svg'
import '@salesforce/retail-react-app/app/assets/svg/chevron-left.svg'
import '@salesforce/retail-react-app/app/assets/svg/chevron-right.svg'
import '@salesforce/retail-react-app/app/assets/svg/chevron-up.svg'
import '@salesforce/retail-react-app/app/assets/svg/dashboard.svg'
import '@salesforce/retail-react-app/app/assets/svg/figma-logo.svg'
import '@salesforce/retail-react-app/app/assets/svg/filter.svg'
import '@salesforce/retail-react-app/app/assets/svg/file.svg'
import '@salesforce/retail-react-app/app/assets/svg/flag-ca.svg'
import '@salesforce/retail-react-app/app/assets/svg/flag-us.svg'
import '@salesforce/retail-react-app/app/assets/svg/flag-gb.svg'
import '@salesforce/retail-react-app/app/assets/svg/flag-fr.svg'
import '@salesforce/retail-react-app/app/assets/svg/flag-it.svg'
import '@salesforce/retail-react-app/app/assets/svg/flag-cn.svg'
import '@salesforce/retail-react-app/app/assets/svg/flag-jp.svg'
import '@salesforce/retail-react-app/app/assets/svg/github-logo.svg'
import '@salesforce/retail-react-app/app/assets/svg/hamburger.svg'
import '@salesforce/retail-react-app/app/assets/svg/info.svg'
import '@salesforce/retail-react-app/app/assets/svg/social-facebook.svg'
import '@salesforce/retail-react-app/app/assets/svg/social-instagram.svg'
import '@salesforce/retail-react-app/app/assets/svg/social-twitter.svg'
import '@salesforce/retail-react-app/app/assets/svg/social-youtube.svg'
import '@salesforce/retail-react-app/app/assets/svg/like.svg'
import '@salesforce/retail-react-app/app/assets/svg/lock.svg'
import '@salesforce/retail-react-app/app/assets/svg/plug.svg'
import '@salesforce/retail-react-app/app/assets/svg/plus.svg'
import '@salesforce/retail-react-app/app/assets/svg/receipt.svg'
import '@salesforce/retail-react-app/app/assets/svg/search.svg'
import '@salesforce/retail-react-app/app/assets/svg/signout.svg'
import '@salesforce/retail-react-app/app/assets/svg/user.svg'
import '@salesforce/retail-react-app/app/assets/svg/visibility.svg'
import '@salesforce/retail-react-app/app/assets/svg/visibility-off.svg'
import '@salesforce/retail-react-app/app/assets/svg/heart.svg'
import '@salesforce/retail-react-app/app/assets/svg/heart-solid.svg'
import '@salesforce/retail-react-app/app/assets/svg/close.svg'

// For non-square SVGs, we can use the symbol data from the import to set the
// proper viewBox attribute on the Icon wrapper.
import AmexSymbol from '@salesforce/retail-react-app/app/assets/svg/cc-amex.svg'
import BrandLogoSymbol from '@salesforce/retail-react-app/app/assets/svg/brand-logo.svg'
import CVVSymbol from '@salesforce/retail-react-app/app/assets/svg/cc-cvv.svg'
import DiscoverSymbol from '@salesforce/retail-react-app/app/assets/svg/cc-discover.svg'
import LocationSymbol from '@salesforce/retail-react-app/app/assets/svg/location.svg'
import MastercardSymbol from '@salesforce/retail-react-app/app/assets/svg/cc-mastercard.svg'
import PaypalSymbol from '@salesforce/retail-react-app/app/assets/svg/paypal.svg'
import SocialPinterestSymbol from '@salesforce/retail-react-app/app/assets/svg/social-pinterest.svg'
import VisaSymbol from '@salesforce/retail-react-app/app/assets/svg/cc-visa.svg'

// TODO: We're hardcoding the `viewBox` for these imported SVGs temporarily as the
// SVG loader plugin is not properly providing us the symbol data on the client side.
AmexSymbol.viewBox = AmexSymbol.viewBox || '0 0 38 22'
BrandLogoSymbol.viewBox = BrandLogoSymbol.viewBox || '0 0 46 32'
CVVSymbol.viewBox = CVVSymbol.viewBox || '0 0 41 24'
DiscoverSymbol.viewBox = DiscoverSymbol.viewBox || '0 0 38 22'
LocationSymbol.viewBox = LocationSymbol.viewBox || '0 0 16 21'
MastercardSymbol.viewBox = MastercardSymbol.viewBox || '0 0 38 22'
PaypalSymbol.viewBox = PaypalSymbol.viewBox || '0 0 80 20'
SocialPinterestSymbol.viewBox = SocialPinterestSymbol.viewBox || '0 0 21 20'
VisaSymbol.viewBox = VisaSymbol.viewBox || '0 0 38 22'

/**
 * A helper for creating a Chakra-wrapped icon from our own SVG imports via sprite sheet.
 * @param {string} name - the filename of the imported svg (does not include extension)
 * @param {Object} passProps - props that will be passed onto the underlying Icon component
 * @param {Object} localizationAttributes - attributes with localized values that will be passed
 *      onto the underlying Icon component, use `defineMessage` to create localized string.
 *      Additionally, if the icon is rendered outside the provider tree, you'll also need to
 *      pass an intl object from react-intl as a prop to translate the messages.
 */
/* istanbul ignore next */
export const icon = (name, passProps, localizationAttributes) => {
    const displayName = name
        .toLowerCase()
        .replace(/(?:^|[\s-/])\w/g, (match) => match.toUpperCase())
        .replace(/-/g, '')
    const component = forwardRef((props, ref) => {
        const theme = useTheme()
        // NOTE: We want to avoid `useIntl` here because that throws when <IntlProvider> is not in
        // the component ancestry, but we only enforce `intl` if we have `localizationAttributes`.
        let intl = useContext(IntlContext)
        if (localizationAttributes) {
            if (props?.intl) {
                const {intl: intlProp, ...otherProps} = props
                // Allow `props.intl` to take precedence over the intl we found
                intl = intlProp
                props = otherProps
            }
            if (!intl) {
                throw new Error(
                    'To localize messages, you must either have <IntlProvider> in the component ancestry or provide `intl` as a prop'
                )
            }
            Object.keys(localizationAttributes).forEach((key) => {
                passProps[key] = intl.formatMessage(localizationAttributes[key])
            })
        }
        const baseStyle = theme?.components?.Icon?.baseStyle
        return (
            <Icon ref={ref} role="img" aria-label={name} {...baseStyle} {...props} {...passProps}>
                <use role="presentation" xlinkHref={`#${name}`} />
            </Icon>
        )
    })

    component.propTypes = {
        intl: PropTypes.object
    }

    component.displayName = `${displayName}Icon`
    return component
}

// Export Chakra icon components that use our SVG sprite symbol internally
// For non-square SVGs, we can use the symbol data from the import to set the
// proper viewBox attribute on the Icon wrapper.
export const AmexIcon = icon('cc-amex', {viewBox: AmexSymbol.viewBox})
export const AlertIcon = icon('alert')
export const AccountIcon = icon('account')
export const BrandLogo = icon('brand-logo', {viewBox: BrandLogoSymbol.viewBox})
export const BasketIcon = icon('basket')
export const CheckIcon = icon('check')
export const CheckCircleIcon = icon('check-circle')
export const ChevronDownIcon = icon('chevron-down')
export const ChevronLeftIcon = icon('chevron-left')
export const ChevronRightIcon = icon('chevron-right')
export const ChevronUpIcon = icon('chevron-up')
export const CVVIcon = icon('cc-cvv', {viewBox: CVVSymbol.viewBox})
export const DashboardIcon = icon('dashboard')
export const DiscoverIcon = icon('cc-discover', {viewBox: DiscoverSymbol.viewBox})
export const FigmaLogo = icon('figma-logo')
export const FilterIcon = icon('filter')
export const FileIcon = icon('file')
export const FlagCAIcon = icon('flag-ca')
export const FlagUSIcon = icon('flag-us')
export const FlagGBIcon = icon('flag-gb')
export const FlagFRIcon = icon('flag-fr')
export const FlagITIcon = icon('flag-it')
export const FlagCNIcon = icon('flag-cn')
export const FlagJPIcon = icon('flag-jp')
export const GithubLogo = icon('github-logo')
export const HamburgerIcon = icon('hamburger')
export const InfoIcon = icon('info')
export const LikeIcon = icon('like')
export const LockIcon = icon(
    'lock',
    {
        'aria-hidden': false,
        focusable: true
    },
    {
        'aria-label': defineMessage({
            id: 'icons.assistive_msg.lock',
            defaultMessage: 'Secure'
        })
    }
)
export const LocationIcon = icon('location')
export const PaypalIcon = icon('paypal', {viewBox: PaypalSymbol.viewBox})
export const PlugIcon = icon('plug')
export const PlusIcon = icon('plus')
export const MastercardIcon = icon('cc-mastercard', {viewBox: MastercardSymbol.viewBox})
export const ReceiptIcon = icon('receipt')
export const SearchIcon = icon('search', {'aria-hidden': true})
export const SocialFacebookIcon = icon('social-facebook')
export const SocialInstagramIcon = icon('social-instagram')
export const SocialPinterestIcon = icon('social-pinterest', {
    viewBox: SocialPinterestSymbol.viewBox
})
export const SocialTwitterIcon = icon('social-twitter')
export const SocialYoutubeIcon = icon('social-youtube')
export const SignoutIcon = icon('signout')
export const UserIcon = icon('user')
export const VisaIcon = icon('cc-visa', {viewBox: VisaSymbol.viewBox})
export const VisibilityIcon = icon('visibility')
export const VisibilityOffIcon = icon('visibility-off')
export const HeartIcon = icon('heart')
export const HeartSolidIcon = icon('heart-solid')
export const CloseIcon = icon('close')
