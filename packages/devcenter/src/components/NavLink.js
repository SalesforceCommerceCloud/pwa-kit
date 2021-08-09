/** @jsx jsx */
import {jsx} from 'theme-ui'
import {Box} from '@theme-ui/components'
import ExternalLink from './icons/ExternalLink'
import Icon from './icons/Icon'
import {Link} from 'gatsby'
import theme from '../gatsby-plugin-theme-ui/'
import {useState} from 'react'
import {useThemeUI} from 'theme-ui'
import styled from '@emotion/styled'

const NavLink = ({item, internal = true, className = '', iconColor, isInDropDown}) => {
    const [isHover, setHover] = useState(false)
    const {theme} = useThemeUI()

    if (internal) {
        return isInDropDown ? (
            <Link
                title={item.title}
                key={item.url}
                sx={dropDownLinkBase}
                to={item.url}
                className={className}
                activeClassName="is-active"
                partiallyActive={true}
            >
                {item.title}
            </Link>
        ) : (
            <Link
                title={item.title}
                key={item.url}
                sx={linkStylesBase}
                to={item.url}
                className={className}
                activeClassName="is-active"
                partiallyActive={true}
            >
                {item.title}
            </Link>
        )
    } else {
        return (
            <a
                className={className}
                title={item.title}
                sx={linkStylesBase}
                rel="noopener noreferrer"
                href={item.url}
                target="_blank"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {item.title}
                <Box
                    sx={{
                        paddingLeft: 'sm',
                        display: 'inline-flex',
                        verticalAlign: 'bottom'
                    }}
                >
                    {isHover && isInDropDown ? (
                        <Icon icon={<ExternalLink fill={theme.colors.brightBlue} />} size={18} />
                    ) : (
                        <Icon icon={<ExternalLink fill={iconColor} />} size={18} />
                    )}
                </Box>
            </a>
        )
    }
}

const linkStylesBase = {
    color: 'headerText',
    display: 'inline-block',
    fontFamily: theme.fonts.heading,
    whiteSpace: 'nowrap',
    padding: 'sm',
    marginLeft: 0,
    marginRight: 0,
    fontWeight: 'light',
    boxSizing: 'border-box',
    borderWidth: 'thin',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 'sm',
    textDecoration: 'none',
    transition: 'transition',
    textAlign: 'center',
    ':active': {
        backgroundColor: 'transparent',
        borderWidth: 'thin',
        borderStyle: 'solid',
        borderColor: 'transparent'
    },
    ':focus': {
        backgroundColor: 'none',
        borderWidth: 'thin',
        borderStyle: 'solid',
        borderColor: 'lightTransparent',
        outline: 'none'
    },
    ':hover': {
        backgroundColor: 'darkTransparent',
        borderWidth: 'thin',
        borderStyle: 'solid',
        borderColor: 'transparent'
    },
    '&.is-active': {
        fontWeight: 'medium'
    },
    '&.is-active::before': {
        position: 'absolute',
        backgroundColor: 'white',
        content: 'attr(title)',
        height: theme.space.xs,
        color: 'transparent',
        bottom: 'zero'
    }
}

const dropDownLinkBase = {
    ...linkStylesBase,
    position: 'relative'
}

export default NavLink
