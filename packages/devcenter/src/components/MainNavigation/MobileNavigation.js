import styled from '@emotion/styled'
import PropTypes from 'prop-types'
import React, {useState} from 'react'
import Navigation from './Navigation'
import mainNav from '../../../mainNavConst'
import {convert2DArrayToObj, getNavigationRootMobile} from '../../utils/helpers'
import {calculateTreeData} from '../../utils/helpers'
import Sheet from 'progressive-web-sdk/dist/components/sheet'
import Nav from 'progressive-web-sdk/dist/components/nav'
import NavMenu from 'progressive-web-sdk/dist/components/nav-menu'
import NavItem from 'progressive-web-sdk/dist/components/nav-item'
import arrowIcon from '../../images/arrow.svg'
import externalLinkNav from '../../images/external-link-nav.svg'
import closeIcon from '../../images/close-no-bg.svg'
import headerBg from '../../images/header-bg.svg'
import {filterSidebarContent} from '../../utils/helpers'
import LogoWrapper from '../LogoWrapper'
/**
 * This File was inspired by https://github.com/hasura/gatsby-gitbook-starter
 */

const MobileNavigation = ({
    navOpen,
    allMdx,
    allSite,
    setNavOpen,
    isOpen,
    setCollapsed,
    dispatch,
    mobileNavPath
}) => {
    const {sidebarConfig, externalLinks} = allSite.edges[0].node.siteMetadata
    const data = filterSidebarContent(allMdx, location.pathname)
    const activeSubPath =
        location.pathname &&
        location.pathname
            .split('/')
            .filter(Boolean)
            .find((name) => {
                return Object.values(mainNav).includes(name)
            })
    const forcedNavOrder = convert2DArrayToObj(sidebarConfig.forcedNavOrder)[activeSubPath] || []
    const mainNavigationNodes = allMdx.edges.filter(
        ({node}) => node.fields.slug !== '/' && node.fields.group === 'root'
    )
    const [mobileTreeData, setMobileTreeData] = useState(calculateTreeData(data, forcedNavOrder))
    const navigationRootMobile = getNavigationRootMobile(mainNavigationNodes, externalLinks)

    const customHeader = (
        <SheetHeader className="u-flexbox" onClick={() => setNavOpen(false)}>
            <LogoWrapper />
            <SheetHeaderIcon>
                <img src={closeIcon} alt="close" />
            </SheetHeaderIcon>
        </SheetHeader>
    )
    return (
        <ModifiedSheet
            headerContent={customHeader}
            open={navOpen}
            className="mobile__sheet"
            onDismiss={() => setNavOpen(false)}
            coverage="70%"
        >
            <Nav
                root={navigationRootMobile}
                path={mobileNavPath}
                onPathChange={(path, isLeaf) => {
                    dispatch({
                        type: 'SET_MOBILE_NAV_PATH',
                        mobileNavPath: path
                    })
                    if (path !== '/' && !isLeaf) {
                        const activeSubPath = path.split('/')[1]
                        const nodes = filterSidebarContent(allMdx, activeSubPath)
                        const forcedNavOrder =
                            convert2DArrayToObj(sidebarConfig.forcedNavOrder)[activeSubPath] || []

                        const data = calculateTreeData(nodes, forcedNavOrder)
                        setMobileTreeData(data)
                    }
                }}
            >
                <NavMenu
                    itemFactory={(type, props) =>
                        itemFactory(type, props, setCollapsed, isOpen, mobileTreeData, dispatch)
                    }
                />
            </Nav>
        </ModifiedSheet>
    )
}

const ExternalLinks = (props) => {
    const {title, childIcon, path} = props
    return (
        <ExternalNavLinks href={path}>
            <span className="external-links__title">{title}</span>
            {childIcon}
        </ExternalNavLinks>
    )
}

const itemFactory = (type, props, setCollapsed, isOpen, treeData, dispatch) => {
    switch (type) {
        case 'internal':
            return <ModifiedNavItem {...props} childIcon={<img src={arrowIcon} alt="arrow" />} />
        case 'external':
            return (
                <ExternalLinks
                    {...props}
                    childIcon={<img width="24" src={externalLinkNav} alt="external-links" />}
                />
            )
    }
    return (
        <React.Fragment key={props.title}>
            <MobileNavHeaderWrapper
                onClick={() => {
                    dispatch({
                        type: 'SET_MOBILE_NAV_PATH',
                        mobileNavPath: '/'
                    })
                }}
            >
                <IconWrapper>
                    <RotatedArrow src={arrowIcon} alt="arrow" />
                </IconWrapper>
                <span>Main Menu</span>
            </MobileNavHeaderWrapper>
            <Navigation
                {...props}
                location={location}
                treeData={treeData}
                setCollapsed={setCollapsed}
                isOpen={isOpen}
            />
        </React.Fragment>
    )
}

const SheetHeader = styled.div`
    background: url(${headerBg});
    display: flex;
    padding: ${(p) => p.theme.space.md};
    justify-content: space-between;
    align-items: center;
    min-height: ${(p) => p.theme.headerMinHeight};
`

const ModifiedSheet = styled(Sheet)`
    .pw-sheet__inner {
        background: ${(p) => p.theme.colors.lightSilver};
        font-size: ${(p) => p.theme.fontSizes.xs};
        outline: none;
    }

    .pw-list-tile {
        background: ${(p) => p.theme.colors.white};
        border-bottom: 1px solid ${(p) => p.theme.colors.mediumSilver};
    }

    .pw-list-tile__primary {
        min-height: auto;
        outline: none;
        font-weight: ${(p) => p.theme.fontWeights.medium};
    }

    .pw-list-tile__primary {
        padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.mid};
    }

    .pw-sheet__content {
        padding-top: 0;
    }
`

const MobileNavHeaderWrapper = styled.div`
    display: flex;
    min-height: 30px;
    cursor: pointer;
    font-size: ${(p) => p.theme.fontSizes.md};
    padding: ${(p) => p.theme.space.mid} ${(p) => p.theme.space.md};
    background: ${(p) => p.theme.colors.white};
`

const ExternalNavLinks = styled.a`
    background: ${(p) => p.theme.colors.white};
    border-bottom: 1px solid ${(p) => p.theme.colors.mediumSilver};
    padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.mid};
    display: flex;
    text-decoration: none;

    .external-links__title {
        flex: 1;
        font-size: ${(p) => p.theme.fontSizes.md};
        font-weight: ${(p) => p.theme.fontWeights.medium};
        color: ${(p) => p.theme.colors.black};
    }

    &:first-of-type {
        margin-top: ${(p) => p.theme.space.xxl};
    }
`
const ModifiedNavItem = styled(NavItem)`
    font-size: ${(p) => p.theme.fontSizes.md};
`

const RotatedArrow = styled.img`
    transform: rotate(180deg);
`

const IconWrapper = styled.div`
    margin-right: ${(p) => p.theme.space.sm};
`

const SheetHeaderIcon = styled.div`
    cursor: pointer;
`

MobileNavigation.propTypes = {
    navOpen: PropTypes.bool,
    location: PropTypes.object
}

export default MobileNavigation
