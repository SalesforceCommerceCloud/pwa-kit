import React, {useState} from 'react'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'
import NavLink from './NavLink'
import ArrowIcon from '../images/arrow-white.svg'
import {useThemeUI} from 'theme-ui'

function DropDown({items}) {
    const {theme} = useThemeUI()
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div>
            <OverlayLayer isOpen={isOpen} onClick={() => setIsOpen(false)} />

            <DropdownWrapper>
                <DropdownHeader onClick={() => setIsOpen(!isOpen)}>
                    <DropDownLabel>More</DropDownLabel>
                    <div>
                        <Icon isOpen={isOpen} src={ArrowIcon} alt="more" />
                    </div>
                </DropdownHeader>
                {isOpen && (
                    <ListWrapper className="dropdown__list">
                        {items.map((item) => (
                            <NavLink
                                isInDropDown={true}
                                key={item.url}
                                iconColor={theme.colors.gray}
                                item={item}
                                internal={item.internal}
                                className="dropdown__item"
                            />
                        ))}
                    </ListWrapper>
                )}
            </DropdownWrapper>
        </div>
    )
}

const ListWrapper = styled.div`
    padding: ${(p) => p.theme.space.sm} 0;
    background: ${(p) => p.theme.colors.white};
    border-radius: ${(p) => p.theme.radii.md};
    position: absolute;
    left: 0;
    min-width: 200px;
    box-shadow: ${(p) => p.theme.shadows.dark};

    .dropdown__item {
        color: ${(p) => p.theme.colors.black};
        display: block;
        border-radius: 0;
        text-align: left;
        font-weight: ${(p) => p.theme.fontWeights.medium};
        padding: ${(p) => p.theme.space.mid} ${(p) => p.theme.space.md};

        &:hover {
            background: transparent;
            color: ${(p) => p.theme.colors.brightBlue};
            text-decoration: underline;
        }

        &:focus {
            color: ${(p) => p.theme.colors.brightBlue};
            background: ${(p) => p.theme.colors.mediumSilver};
        }

        &.is-active {
            background: ${(p) => p.theme.colors.mediumSilver};
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
    }
`

const Icon = styled.img`
    transform: ${(p) => (p.isOpen ? 'rotate(0deg)' : 'rotate(180deg)')};
`
const DropdownWrapper = styled.div`
    position: relative;
`
const DropDownLabel = styled.div`
    color: ${(p) => p.theme.colors.white};
    margin-right: ${(p) => p.theme.space.xs};
`

const OverlayLayer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    height: 100vh;
    opacity: ${(p) => (p.isOpen ? 1 : 0)};
    pointer-events: ${(p) => (p.isOpen ? 'auto' : 'none')};

    transition: opacity ${(p) => p.theme.transition} linear;
`

const DropdownHeader = styled.button`
    background: transparent;
    padding: ${(p) => p.theme.space.sm};
    display: flex;
    font-weight: ${(p) => p.theme.fontWeights.light};
    font-family: 'Gotham SSm A', -apple-system, sans-serif;
    font-size: ${(p) => p.theme.fontSizes.md};
    border: ${(p) => p.theme.borderWidths[1]}px solid transparent;
    border-radius: ${(p) => p.theme.radii.sm};

    &:focus {
        border-color: ${(p) => p.theme.colors.lightTransparent};
        outline: none;
    }
`
DropDown.propTypes = {
    items: PropTypes.array.isRequired
}

export default DropDown
