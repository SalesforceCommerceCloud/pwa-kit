/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef} from 'react'
import {Icon, useTheme} from '@chakra-ui/react'

// Our own SVG imports. These will be extracted to a single sprite sheet by the
// svg-sprite-loader webpack plugin at build time and injected in the <body> tag
// during SSR.
import AmexSymbol from '../../assets/svg/cc-amex.svg'
import AlertSymbol from '../../assets/svg/alert.svg'
import AccountSymbol from '../../assets/svg/account.svg'
import BasketSymbol from '../../assets/svg/basket.svg'
import CheckSymbol from '../../assets/svg/check.svg'
import CheckCircleSymbol from '../../assets/svg/check-circle.svg'
import ChevronUpSymbol from '../../assets/svg/chevron-up.svg'
import ChevronDownSymbol from '../../assets/svg/chevron-down.svg'
import ChevronRightSymbol from '../../assets/svg/chevron-right.svg'
import ChevronLeftSymbol from '../../assets/svg/chevron-left.svg'
import DashboardSymbol from '../../assets/svg/dashboard.svg'
import FigmaSymbol from '../../assets/svg/figma-logo.svg'
import FilterSymbol from '../../assets/svg/filter.svg'
import FileSymbol from '../../assets/svg/file.svg'
import FlagCASymbol from '../../assets/svg/flag-ca.svg'
import FlagUSSymbol from '../../assets/svg/flag-us.svg'
import FlagGBSymbol from '../../assets/svg/flag-gb.svg'
import FlagFRSymbol from '../../assets/svg/flag-fr.svg'
import FlagITSymbol from '../../assets/svg/flag-it.svg'
import FlagCNSymbol from '../../assets/svg/flag-cn.svg'
import FlagJPSymbol from '../../assets/svg/flag-jp.svg'
import GithubSymbol from '../../assets/svg/github-logo.svg'
import HamburgerSymbol from '../../assets/svg/hamburger.svg'
import InfoSymbol from '../../assets/svg/info.svg'
import FacebookSymbol from '../../assets/svg/social-facebook.svg'
import InstagramSymbol from '../../assets/svg/social-instagram.svg'
import TwitterSymbol from '../../assets/svg/social-twitter.svg'
import YoutubeSymbol from '../../assets/svg/social-youtube.svg'
import LikeSymbol from '../../assets/svg/like.svg'
import LockSymbol from '../../assets/svg/lock.svg'
import PaymentSymbol from '../../assets/svg/payment.svg'
import PlugSymbol from '../../assets/svg/plug.svg'
import PlusSymbol from '../../assets/svg/plus.svg'
import ReceiptSymbol from '../../assets/svg/receipt.svg'
import SearchSymbol from '../../assets/svg/search.svg'
import SignoutSymbol from '../../assets/svg/signout.svg'
import UserSymbol from '../../assets/svg/user.svg'
import VisibilitySymbol from '../../assets/svg/visibility.svg'
import VisibilityOffSymbol from '../../assets/svg/visibility-off.svg'
import HeartSymbol from '../../assets/svg/heart.svg'
import HeartSolidSymbol from '../../assets/svg/heart-solid.svg'
import CloseSymbol from '../../assets/svg/close.svg'
import BrandLogoSymbol from '../../assets/svg/brand-logo.svg'
import CVVSymbol from '../../assets/svg/cc-cvv.svg'
import DiscoverSymbol from '../../assets/svg/cc-discover.svg'
import LocationSymbol from '../../assets/svg/location.svg'
import MastercardSymbol from '../../assets/svg/cc-mastercard.svg'
import PaypalSymbol from '../../assets/svg/paypal.svg'
import PinterestSymbol from '../../assets/svg/social-pinterest.svg'
import VisaSymbol from '../../assets/svg/cc-visa.svg'

/**
 * A helper for creating a Chakra-wrapped icon from our own SVG imports via sprite sheet.
 * @param {object} symbol - SpriteSymbol imported by svg loader
 * @param {string} symbol.id - id generated based on file name
 * @param {string} symbol.viewBox
 * @param {string} symbol.content
 */
/* istanbul ignore next */
const icon = (symbol) => {
    const displayName = symbol.id
        .toLowerCase()
        .replace(/(?:^|[\s-/])\w/g, (match) => match.toUpperCase())
        .replace(/-/g, '')

    const component = forwardRef((props, ref) => {
        const theme = useTheme()
        const {baseStyle} = theme.components.Icon
        return (
            <Icon ref={ref} viewBox={symbol.viewBox} {...baseStyle} {...props}>
                <use role="presentation" xlinkHref={`#${symbol.id}`} />
            </Icon>
        )
    })
    component.displayName = `${displayName}Icon`
    return component
}

// Export Chakra icon components that use our SVG sprite symbol internally
export const AmexIcon = icon(AmexSymbol)
export const AlertIcon = icon(AlertSymbol)
export const AccountIcon = icon(AccountSymbol)
export const BrandLogo = icon(BrandLogoSymbol)
export const BasketIcon = icon(BasketSymbol)
export const CheckIcon = icon(CheckSymbol)
export const CheckCircleIcon = icon(CheckCircleSymbol)
export const ChevronDownIcon = icon(ChevronDownSymbol)
export const ChevronLeftIcon = icon(ChevronLeftSymbol)
export const ChevronRightIcon = icon(ChevronRightSymbol)
export const ChevronUpIcon = icon(ChevronUpSymbol)
export const CVVIcon = icon(CVVSymbol)
export const DashboardIcon = icon(DashboardSymbol)
export const DiscoverIcon = icon(DiscoverSymbol)
export const FigmaLogo = icon(FigmaSymbol)
export const FilterIcon = icon(FilterSymbol)
export const FileIcon = icon(FileSymbol)
export const FlagCAIcon = icon(FlagCASymbol)
export const FlagUSIcon = icon(FlagUSSymbol)
export const FlagGBIcon = icon(FlagGBSymbol)
export const FlagFRIcon = icon(FlagFRSymbol)
export const FlagITIcon = icon(FlagITSymbol)
export const FlagCNIcon = icon(FlagCNSymbol)
export const FlagJPIcon = icon(FlagJPSymbol)
export const GithubLogo = icon(GithubSymbol)
export const HamburgerIcon = icon(HamburgerSymbol)
export const InfoIcon = icon(InfoSymbol)
export const LikeIcon = icon(LikeSymbol)
export const LockIcon = icon(LockSymbol)
export const LocationIcon = icon(LocationSymbol)
export const PaymentIcon = icon(PaymentSymbol)
export const PaypalIcon = icon(PaypalSymbol)
export const PlugIcon = icon(PlugSymbol)
export const PlusIcon = icon(PlusSymbol)
export const MastercardIcon = icon(MastercardSymbol)
export const ReceiptIcon = icon(ReceiptSymbol)
export const SearchIcon = icon(SearchSymbol)
export const SocialFacebookIcon = icon(FacebookSymbol)
export const SocialInstagramIcon = icon(InstagramSymbol)
export const SocialPinterestIcon = icon(PinterestSymbol)
export const SocialTwitterIcon = icon(TwitterSymbol)
export const SocialYoutubeIcon = icon(YoutubeSymbol)
export const SignoutIcon = icon(SignoutSymbol)
export const UserIcon = icon(UserSymbol)
export const VisaIcon = icon(VisaSymbol)
export const VisibilityIcon = icon(VisibilitySymbol)
export const VisibilityOffIcon = icon(VisibilityOffSymbol)
export const HeartIcon = icon(HeartSymbol)
export const HeartSolidIcon = icon(HeartSolidSymbol)
export const CloseIcon = icon(CloseSymbol)
