import styled from '@emotion/styled'
import PropTypes from 'prop-types'
import React from 'react'
import mediaqueries from '../../styles/media'
import Navigation from './Navigation'

/**
 * This File was inspired by https://github.com/hasura/gatsby-gitbook-starter
 */

const LeftSidebar = ({location, showLeftSidebar, treeData, setCollapsed, isOpen}) => {
    return (
        showLeftSidebar && (
            <LeftSidebarWrapper>
                <LeftSidebarNav>
                    <Navigation
                        location={location}
                        treeData={treeData}
                        setCollapsed={setCollapsed}
                        isOpen={isOpen}
                    />
                </LeftSidebarNav>
            </LeftSidebarWrapper>
        )
    )
}

const LeftSidebarWrapper = styled.aside`
    flex: 0 0 ${(p) => p.theme.sidebarWidth};
    font-size: ${(p) => p.theme.fontSizes.xs};
    padding-left: ${(p) => p.theme.space.lg};

    ${(p) => mediaqueries.tablet`
        display: none;
        padding-left: ${p.theme.space.lg};
    `};
`

const LeftSidebarNav = styled.nav`
    min-width: ${(p) => p.theme.sidebarWidth};
    width: ${(p) => p.theme.sidebarWidth};
    height: 100%;
    padding-top: ${(p) => p.theme.space.xl};

    ${(p) => mediaqueries.desktop_medium_up`
        width: ${p.theme.sidebarWidthDesktop};
        padding-bottom: ${p.theme.space.md};
        z-index: 0;
    `};
`

LeftSidebar.propTypes = {
    navOpen: PropTypes.bool,
    location: PropTypes.object
}
export default React.memo(LeftSidebar)
