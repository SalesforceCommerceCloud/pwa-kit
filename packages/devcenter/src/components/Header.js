import React, {useContext, useState} from 'react'
import styled from '@emotion/styled'
import config from '../../config.js'
import HeaderBg from '../images/header-bg.svg'
import Search from './search/search'
import PropTypes from 'prop-types'
import mediaqueries from '../styles/media'
import LogoWrapper from './LogoWrapper'
import TopBanner from './TopBanner'
import {GlobalStateContext} from '../context/GlobalContextProvider'
import Menu from '../images/menu.svg'
import HeaderNavigation from './HeaderNavigation'
import {DesktopLarge} from '../hooks/useMedia'
import NavLink from './NavLink'

const isSearchEnabled = !!(config.header.search && config.header.search.enabled)
const indexName = config.header.search.indexName

const searchIndices =
    isSearchEnabled && indexName
        ? [
              {
                  name: `${indexName}`,
                  title: `Results`,
                  hitComp: `PageHit`
              }
          ]
        : []

const ConditionalWrapper = ({condition, wrapper, children}) =>
    condition ? wrapper(children) : children

const Header = ({navOpen, setNavOpen, location}) => {
    const [isInputFocus, setFocus] = useState(false)
    const state = useContext(GlobalStateContext)
    return (
        <StyledHeader navOpen={navOpen}>
            <ConditionalWrapper
                condition={state.topBanner}
                wrapper={(children) => <StyledTopBannerWrapper>{children}</StyledTopBannerWrapper>}
            >
                <TopBanner />
                <HeaderWrapper>
                    <OverlayLayer isInputFocus={isInputFocus} onClick={() => setFocus(false)} />

                    <HeaderSection isInputFocus={isInputFocus}>
                        <NavIconButton>
                            <ButtonWrapper onClick={() => setNavOpen(true)}>
                                <img src={Menu} alt="menu" />
                                <NavIconLabel>Menu</NavIconLabel>
                            </ButtonWrapper>
                        </NavIconButton>
                        <LogoWrapper />
                        {!isInputFocus && (
                            <HeaderNavigation
                                internalItems={config.header.internalLinks}
                                externalItems={config.header.externalLinks.slice(0, 2)}
                            />
                        )}
                    </HeaderSection>
                    <SearchSection isInputFocus={isInputFocus}>
                        {isSearchEnabled ? (
                            <SearchWrapper isInputFocus={isInputFocus}>
                                <Search
                                    isInputFocus={isInputFocus}
                                    setFocus={setFocus}
                                    indices={searchIndices}
                                />
                            </SearchWrapper>
                        ) : null}
                    </SearchSection>
                    <DesktopLarge>
                        <ExternalLinks>
                            {config.header.externalLinks.slice(0, 2).map((item) => (
                                <NavLink item={item} internal={item.internal} key={item.url} />
                            ))}
                        </ExternalLinks>
                    </DesktopLarge>
                </HeaderWrapper>
            </ConditionalWrapper>
        </StyledHeader>
    )
}

const ButtonWrapper = styled.div`
    color: ${(p) => p.theme.colors.chrome};
    line-height: 1;
    margin: 0;
    text-align: center;
    border-radius: ${(p) => p.theme.radii.sm};
    font-size: ${(p) => p.theme.fontSizes.xs};
`

const SearchWrapper = styled.div`
    justify-content: flex-end;
    position: relative;
    margin-left: ${(p) => p.theme.space.md};

    width: ${(p) => (p.isInputFocus ? '100%' : 'auto')};
    ${mediaqueries.tablet`
        margin-left: 0;
        width: 100%;   
        position: static;
    `};
`

const OverlayLayer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.2);
    height: 100vh;
    opacity: ${(p) => (p.isInputFocus ? 1 : 0)};
    pointer-events: ${(p) => (p.isInputFocus ? 'auto' : 'none')};

    transition: opacity ${(p) => p.theme.transition} linear;

    ${mediaqueries.tablet`
        background: none;
    `};
`

const StyledHeader = styled.header`
    display: flex;
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    justify-content: center;
    align-items: center;
    box-shadow: ${(p) => p.theme.shadows.dark};
    z-index: 1;
    background: url(${HeaderBg});
    background-color: ${(p) => p.theme.colors.headerBackground};
    background-size: cover;
    background-repeat: no-repeat;
    background-position-x: left;
    ${mediaqueries.desktop_up`
        top: 0;
        transform: translateX(0);
    `};
`

const NavIconLabel = styled.div`
    margin-top: 2px;
`

const HeaderWrapper = styled.div`
    max-width: ${(p) => p.theme.maxPageWidth};
    display: flex;
    flex-basis: ${(p) => p.theme.maxPageWidth};
    margin: 0 auto;
    padding: ${(p) => p.theme.space.mid} ${(p) => p.theme.space.xl}; // 12px 24px
    ${mediaqueries.tablet`
        flex-direction: column;
        padding: 0;
    `};
`

const StyledTopBannerWrapper = styled.div`
    padding: ${(p) => p.theme.space.zero};
    width: 100%;
`

const NavIconButton = styled.div`
    display: flex;
    cursor: pointer;
    margin-right: ${(p) => p.theme.space.md};
    ${mediaqueries.desktop_up`
        display: none;
    `};
`

const HeaderSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    line-height: ${(p) => p.theme.lineHeights.link};
    flex: 1;
    ${(p) => mediaqueries.tablet`
        padding: ${p.theme.space.mid} ${p.theme.space.md};
        border-bottom: 1px solid rgba(0,0,0, 0.35)
    `};

    &:nth-of-type(3) {
        ${mediaqueries.desktop`
            border-bottom: none;
        `};
    }
`

const SearchSection = styled(HeaderSection)`
    justify-content: flex-end;
    flex: 4;
    transition: flex ${(p) => p.theme.transition} ease-in-out;

    ${mediaqueries.tablet`
        position: relative;
    `};
`

const ExternalLinks = styled(HeaderSection)`
    flex: 0.5;
    justify-content: flex-end;
    padding-left: ${(p) => p.theme.space.sm};
    padding-right: ${(p) => p.theme.space.xs};
`

Header.propTypes = {
    navOpen: PropTypes.bool,
    setNavOpen: PropTypes.func
}

export default Header
