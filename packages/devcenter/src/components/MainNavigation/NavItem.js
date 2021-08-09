import styled from '@emotion/styled'
import {Link} from 'gatsby'
import React from 'react'
import PropTypes from 'prop-types'
import toTitleCase from '@gouch/to-title-case'
import Icon from '../icons/Icon'
import Add from '../icons/Add'
import startCase from 'lodash.startcase'
const iconSize = 18

const NavItem = ({item, level, className = '', setCollapsed, pathname, isOpen}) => {
    const collapse = () => {
        setCollapsed(item.path)
    }
    const isOpened = level < 2 || isOpen.includes(item.path)

    const hasChildren = item.children && item.children.length > 0

    const NavItemWrapperClasses = `NavItem--level-${level}${className ? '' : className}`
    return (
        <StyledNavItemWrapper level={level} className={NavItemWrapperClasses}>
            {item.group !== 'root' && level === 1 ? (
                <Label className={`nav__label--level-${level}`} level={level}>
                    {startCase(item.label)}
                </Label>
            ) : null}

            {hasChildren && level >= 2 && (
                <LabelWrapper
                    level={level}
                    onClick={collapse}
                    className={!isOpened ? null : 'active'}
                >
                    <Label className={`label--level-${level} nav__label`} level={level}>
                        <ModifiedIcon level={level}>
                            <Icon icon={<Add />} size={iconSize} />
                        </ModifiedIcon>
                        {startCase(item.label).toTitleCase()}
                    </Label>
                </LabelWrapper>
            )}
            {item.desktopTitle && !item.is_parent && (
                <NavItemLink
                    level={level}
                    className={`NavItemLink--level-${level}`}
                    to={item.url ? item.url : '/'}
                    activeClassName="is-active"
                    partiallyActive={false}
                >
                    {item.desktopTitle}
                </NavItemLink>
            )}

            {hasChildren && isOpened && (
                <NavItemChild>
                    {item.children.map((child) => (
                        <NavItem
                            pathname={pathname}
                            key={child.title || child.label}
                            level={level + 1}
                            item={child}
                            isOpen={isOpen}
                            setCollapsed={setCollapsed}
                            activeClassName="is-active"
                            partiallyActive={false}
                        >
                            {child.title}
                        </NavItem>
                    ))}
                </NavItemChild>
            )}
        </StyledNavItemWrapper>
    )
}

const ModifiedIcon = styled.div`
    position: absolute;
    left: -${iconSize}px;
    top: 50%;
    display: flex;
    transform: translateY(-50%);
`
const Label = styled.div`
    position: relative;
    padding-top: ${(p) => p.theme.space.sm};
    padding-bottom: ${(p) => p.theme.space.sm};
    padding-left: ${(p) => (p.level === 1 ? p.theme.space.md : p.theme.space.zero)};
    font-weight: ${(p) => (p.level === 1 ? p.theme.fontWeights.bolder : 'normal')};
    color: ${(p) => (p.level >= 2 ? p.theme.colors.text : p.theme.colors.gray)};
    font-size: ${(p) => (p.level >= 2 ? p.theme.fontSizes.md : p.theme.fontSizes.sm)};
    text-transform: ${(p) => (p.level >= 2 ? 'initial' : 'uppercase')};
    line-height: ${(p) => p.theme.lineHeights.link};
`

const LabelWrapper = styled.button`
    display: flex;
    cursor: pointer;
    background: transparent;
    width: 100%;
    border-width: 0;
    outline: 0;
    align-items: center;
    font-weight: ${(p) => (p.level === 0 ? p.theme.fontWeights.light : 'inherit')};
    padding-left: ${(p) => p.level * iconSize}px;
    color: ${(p) => (p.level >= 1 ? p.theme.colors.text : 'inherit')};

    &.active {
        svg {
            transition: transform ${(p) => p.theme.transition} ease-out;
            transform: rotate(45deg);
        }
    }

    &:active {
        background: ${(p) => p.theme.colors.mediumSilver};
    }

    button {
        outline: none;
        padding: 0;
    }

    :hover {
        text-decoration: underline;

        svg {
            fill: ${(p) => p.theme.colors.brightBlue};
        }

        ${Label} {
            color: ${(p) => p.theme.colors.brightBlue};
        }
    }
`

const StyledNavItemWrapper = styled.li`
    position: relative;
    display: block;
    padding: 0;
    margin: 0;
    width: 100%;
    list-style: none;
    border-top: ${(p) => p.theme.borderWidths.thinnest} solid
        ${(p) => (p.level === 1 ? p.theme.colors.chromeShadow : 'transparent')};

    &.NavItem--level-1 {
        padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.zero};
    }

    &.NavItem--level-0:first-of-type {
        border-top: ${(p) => p.theme.borderWidths.thinnest} solid transparent;
    }

    & a {
        -webkit-font-smoothing: antialiased;
    }
`

const NavItemLink = styled(Link)`
    font-size: ${(p) => p.theme.fontSizes.md};
    display: block;
    line-height: ${(p) => p.theme.lineHeights.link};
    padding: ${(p) => p.theme.space.sm};
    padding-left: ${(p) => p.level * iconSize}px;
    width: 100%;
    color: ${(p) => p.theme.colors.text};
    text-decoration: none;
    box-sizing: border-box;
    transition: color ${(p) => p.theme.transition};
    &.is-active {
        background: ${(p) => p.theme.colors.mediumSilver};
        position: relative;
        color: ${(p) => p.theme.colors.brightBlue};

        &:before {
            content: ' ';
            position: absolute;
            border-left: 4px solid ${(p) => p.theme.colors.secondary};
            height: 100%;
            top: 0;
            left: 0;
        }
    }
    :hover {
        color: ${(p) => p.theme.colors.brightBlue};
        text-decoration: underline;
    }

    :focus {
        background: ${(p) => p.theme.colors.mediumSilver};
        position: relative;
        color: ${(p) => p.theme.colors.brightBlue};
    }

    &.NavItemLink--level-1 {
        padding-left: ${iconSize * 2}px; // 36px
    }
`

const NavItemChild = styled.ul`
    margin: ${(p) => p.theme.space.zero};
    padding: 0;
    list-style: none;
    & > li {
        margin: 0;
    }
`

NavItem.propTypes = {
    item: PropTypes.object.isRequired,
    className: PropTypes.string,
    level: PropTypes.number.isRequired,
    setCollapsed: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    isOpen: PropTypes.array
}
export default React.memo(NavItem)
