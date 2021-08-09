import styled from '@emotion/styled'
import React from 'react'
import PropTypes from 'prop-types'
import NavItem from './NavItem'

const Navigation = ({location, treeData, setCollapsed, isOpen}) => {
    return (
        <NavList>
            {treeData.children &&
                treeData.children.map((item) => (
                    <NavItem
                        pathname={location.pathname}
                        setCollapsed={setCollapsed}
                        isOpen={isOpen}
                        level={1}
                        key={item.label}
                        item={item}
                    />
                ))}
        </NavList>
    )
}

const NavList = styled.ul`
    margin: ${(p) => p.theme.space.zero};
    padding: ${(p) => p.theme.space.zero};
    list-style: none;
    background-color: ${(p) => p.theme.colors.chrome};
    border-radius: ${(p) => p.theme.radii.sm};
`

Navigation.propTypes = {
    location: PropTypes.object.isRequired
}
export default Navigation
