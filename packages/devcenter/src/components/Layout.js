import {Global} from '@emotion/core'
import styled from '@emotion/styled'
import PropTypes from 'prop-types'
import React, {useState} from 'react'
import {Styled} from 'theme-ui'
import {globalStyles} from '../styles'
import mediaqueries from '../styles/media'
import Header from './Header'
import useScrollToHash from '../hooks/useScrollToHash'
import MainNavigation from './MainNavigation'
import RightSidebar from './RightSidebar'
import Footer from './Footer'
import {css} from '@emotion/core'

const dynamicMaxWidth = (props) => {
    if (props.column === 1) {
        return css`
            max-width: ${props.theme.oneColumnContentWidth};
        `
    } else if (props.column === 2) {
        return css`
            max-width: ${props.theme.twoColumnContentWidth};

            ${mediaqueries.desktop_medium`
                max-width: 60vw;
            `};

            ${mediaqueries.tablet`
                max-width: 100%;
            `};
        `
    } else
        return css`
            max-width: ${props.theme.threeColumnContentWidth};

            ${mediaqueries.desktop_medium`
                max-width: 60vw;
            `};

            ${mediaqueries.tablet`
                max-width: 100%;
            `};
        `
}
const Layout = ({
    isJsdocPage,
    children,
    location = {},
    showLeftSidebar = true,
    className,
    isWhiteFooter,
    column = 3,
    isHomePage
}) => {
    const [navOpen, setNavOpen] = useState(false)
    useScrollToHash()
    return (
        <Styled.root>
            <Global styles={globalStyles} />
            <LayoutWrapper>
                <Header navOpen={navOpen} setNavOpen={setNavOpen} />
                <SiteWrapper className="layout__site-wrapper">
                    <MainNavigation
                        showLeftSidebar={showLeftSidebar}
                        setNavOpen={setNavOpen}
                        navOpen={navOpen}
                        location={location}
                    />
                    <SiteContentWrapper className="layout__site-content-wrapper">
                        <SiteContent
                            column={column}
                            isHomePage={isHomePage}
                            className={className}
                            navOpen={navOpen}
                        >
                            {children}
                        </SiteContent>
                    </SiteContentWrapper>
                    {column === 3 && <RightSidebar isJsdocPage={isJsdocPage} location={location} />}
                </SiteWrapper>
                <Footer isWhiteFooter={isWhiteFooter} />
            </LayoutWrapper>
        </Styled.root>
    )
}

const LayoutWrapper = styled.div`
    position: relative;
    min-height: 100vh;
`

const SiteWrapper = styled.div`
    display: flex;
    min-height: 80vh;
    transition: background ${(p) => p.theme.transition} var(--ease-in-out-quad);
    max-width: ${(p) => p.theme.maxPageWidth};
    margin-left: auto;
    margin-right: auto;
`

const SiteContentWrapper = styled.div`
    flex-grow: 1;
    padding: ${(p) => p.theme.space.xl} ${(p) => p.theme.space.md};

    ${mediaqueries.tablet`
        max-width: 100vw;
    `};

    ${(p) => mediaqueries.desktop_up`
        padding: ${p.theme.space.xl};
    `};

    ${(p) => mediaqueries.desktop_medium_up`
        padding: ${p.theme.space.largish} ${p.theme.space.exlg}
    `};
`

const SiteContent = styled('main')`
    padding-bottom: ${(p) => p.theme.space.xxl};
    opacity: ${(p) => (p.navOpen ? 0.3 : 1)};

    ${(p) => mediaqueries.desktop_up`
        opacity: 1;
        padding-bottom: ${p.theme.space.xxxl};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
       
    `};
    ${dynamicMaxWidth};
`

Layout.propTypes = {
    children: PropTypes.node.isRequired,
    location: PropTypes.object,
    column: PropTypes.number,
    showLeftSidebar: PropTypes.bool,
    isWhiteFooter: PropTypes.bool,
    isHomePage: PropTypes.bool,
    isJsdocPage: PropTypes.bool,
    className: PropTypes.string
}

export default Layout
