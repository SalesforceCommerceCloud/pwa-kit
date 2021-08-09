import React from 'react'
import PropTypes from 'prop-types'
import NavLink from './NavLink'
import styled from '@emotion/styled'
import {DesktopLarge, DesktopMedium, Tablet} from '../hooks/useMedia'
import DropDown from './DropDown'

function HeaderNavigation({internalItems = [], externalItems = []}) {
    const items = [...internalItems, ...externalItems]
    return (
        <NavigationWrapper>
            <DesktopLarge>
                {internalItems.map((item) => (
                    <NavLink item={item} internal={item.internal} key={item.url} />
                ))}
            </DesktopLarge>
            <DesktopMedium>
                {items.slice(0, 3).map((item) => (
                    <NavLink item={item} internal={item.internal} key={item.url} />
                ))}
                <DropDown items={items.slice(3)} />
            </DesktopMedium>
            <Tablet>
                {items.slice(0, 2).map((item) => (
                    <NavLink item={item} internal={item.internal} key={item.url} />
                ))}
                <DropDown items={items.slice(2)} />
            </Tablet>
        </NavigationWrapper>
    )
}

const NavigationWrapper = styled.div`
    display: flex;
    margin-left: ${(p) => p.theme.space.sm};
    align-items: center;
`
HeaderNavigation.propTypes = {}

export default HeaderNavigation
