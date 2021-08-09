import React, {useRef} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {useMultiStyleConfig, Box, Flex, IconButton, Badge} from '@chakra-ui/react'
import useBasket from '../../commerce-api/hooks/useBasket'
import SearchInput from '../search-input'
import {AccountIcon, BrandLogo, BasketIcon, HamburgerIcon} from '../icons'
import {noop} from '../../utils/utils'

/**
 * The header is the main source for accessing
 * navigation, search, basket, and other
 * important information and actions. It persists
 * on the top of your application and will
 * respond to changes in device size.
 *
 * To customize the styles, update the themes
 * in theme/components/project/header.js
 * @param  props
 * @param   {func} props.onMenuClick click event handler for menu button
 * @param   {func} props.onLogoClick click event handler for menu button
 * @param   {object} props.searchInputRef reference of the search input
 * @param   {func} props.onSearchSubmit submit event handler for search input
 * @param   {func} props.onSearchChange input change event handler for search input
 * @param   {func} props.onMyAccountClick click event handler for my account button
 * @param   {func} props.onMyCartClick click event handler for my cart button
 * @return  {React.ReactElement} - Header component
 */
const Header = ({
    children,
    searchInputRef,
    onMenuClick = noop,
    onSearchSubmit = noop,
    onSearchChange = noop,
    onMyAccountClick = noop,
    onLogoClick = noop,
    onMyCartClick = noop,
    ...props
}) => {
    const intl = useIntl()
    const basket = useBasket()
    const styles = useMultiStyleConfig('Header')

    searchInputRef = searchInputRef || useRef()

    return (
        <Box {...styles.container} {...props}>
            <Box {...styles.content}>
                <Flex wrap="wrap" alignItems="start">
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.menu',
                            defaultMessage: 'Menu'
                        })}
                        icon={<HamburgerIcon />}
                        variant="unstyled"
                        display={{lg: 'none'}}
                        {...styles.icons}
                        onClick={onMenuClick}
                    />
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.logo',
                            defaultMessage: 'Logo'
                        })}
                        icon={<BrandLogo {...styles.logo} />}
                        {...styles.icons}
                        variant="unstyled"
                        onClick={onLogoClick}
                    />
                    <Box {...styles.bodyContainer}>{children}</Box>
                    <Box {...styles.searchContainer}>
                        <form onSubmit={(e) => onSearchSubmit(e, searchInputRef.current.value)}>
                            <SearchInput
                                placeholder={intl.formatMessage({
                                    id: 'header.search.field.value.placeholder',
                                    defaultMessage: 'Search for products...'
                                })}
                                ref={searchInputRef}
                                {...styles.search}
                                onChange={onSearchChange}
                            />
                        </form>
                    </Box>
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.my_account',
                            defaultMessage: 'My account'
                        })}
                        icon={<AccountIcon />}
                        variant="unstyled"
                        {...styles.icons}
                        onClick={onMyAccountClick}
                    />
                    <IconButton
                        aria-label={intl.formatMessage({
                            id: 'header.button.assistive_msg.my_cart',
                            defaultMessage: 'My cart'
                        })}
                        icon={
                            <>
                                <BasketIcon />
                                {basket?.loaded() && (
                                    <Badge variant="notification">
                                        {basket.itemAccumulatedCount}
                                    </Badge>
                                )}
                            </>
                        }
                        variant="unstyled"
                        {...styles.icons}
                        onClick={onMyCartClick}
                    />
                </Flex>
            </Box>
        </Box>
    )
}

Header.propTypes = {
    children: PropTypes.node,
    onMenuClick: PropTypes.func,
    onLogoClick: PropTypes.func,
    onSearchSubmit: PropTypes.func,
    onSearchChange: PropTypes.func,
    onMyAccountClick: PropTypes.func,
    onMyCartClick: PropTypes.func,
    searchInputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({current: PropTypes.elementType})
    ])
}

export default Header
