/** @jsx jsx */
import {jsx} from 'theme-ui'
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
import CookieConsent, {Cookies} from 'react-cookie-consent'
import theme from '../gatsby-plugin-theme-ui'
import CloseIcon from './icons/Close.svg'

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
    const [showCookieBar, setShowCookieBar] = useState(true)
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
                {showCookieBar && (
                    <CookieConsentWrapper>
                        <CookieConsent
                            disableStyles={true}
                            location="none"
                            enableDeclineButton
                            flipButtons
                            containerClasses="CookieConsentContainer"
                            contentClasses="CookieConsentContent"
                            buttonWrapperClasses="CookieConsentWrapperButton"
                            buttonClasses="CookieConsentButton"
                            declineButtonClasses="CookieConsentButtonDecline"
                            buttonText="Allow Cookies"
                            declineButtonText="Decline"
                            cookieName="gatsby-gdpr-google-tagmanager"
                        >
                            <div>
                                🍪 Mobify uses cookies to allow us to better understand how the site
                                is being used. For more information, please see our{' '}
                                <a
                                    sx={{color: 'white'}}
                                    href="https://resources.mobify.com/privacy.html"
                                    target="_blank"
                                >
                                    Privacy Policy
                                </a>
                                .
                            </div>
                            <StyledButtonClose
                                onClick={() => {
                                    setShowCookieBar(false)
                                    Cookies.set('gatsby-gdpr-google-tagmanager', false)
                                }}
                            >
                                <span>
                                    <span sx={{verticalAlign: 'top'}}>
                                        <img src={CloseIcon} alt="close" />
                                    </span>
                                </span>
                            </StyledButtonClose>
                        </CookieConsent>
                    </CookieConsentWrapper>
                )}
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

const CookieConsentWrapper = styled.div`
    .CookieConsentContainer {
        align-items: baseline;
        background: ${(p) => p.theme.colors.black};
        color: ${(p) => p.theme.colors.white};
        box-shadow: ${(p) => p.theme.shadows.dark};
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        position: fixed;
        z-index: ${(p) => p.theme.zIndices.z3Depth};
        width: 100%;
        right: 0;
        bottom: 0;

        ${(p) => mediaqueries.desktop_up`
            width: 360px;
            right: ${p.theme.space.xl};
            bottom: ${p.theme.space.xl};
            border-radius: ${p.theme.radii.sm};
        `};
    }

    .CookieConsentContent {
        display: flex;
        flex: 1 0 300px;
        margin: ${(p) => p.theme.space.lg} ${(p) => p.theme.space.xl};
    }

    .CookieConsentWrapperButton {
        width: 100%;
        margin: ${(p) => p.theme.space.zero} ${(p) => p.theme.space.xl};
    }

    .CookieConsentButton,
    .CookieConsentButtonDecline {
        background: ${(p) => p.theme.colors.brightBlue};
        box-shadow: ${(p) => p.theme.shadows.primaryButton};
        color: ${(p) => p.theme.colors.white};
        border: ${theme.borderWidths.thinnest} solid transparent;
        border-radius: ${(p) => p.theme.radii.sm};
        cursor: pointer;
        flex: 0 0 auto;

        padding: ${(p) => p.theme.space.mid} ${(p) => p.theme.space.xl};
        margin: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.zero};
        width: 100%;
        font-size: ${(p) => p.theme.space.md};
        font-weight: ${(p) => p.theme.fontWeights.bold};
        &:hover {
            background: ${(p) => p.theme.colors.darkBlue};
        }
        &:active {
            background: ${(p) => p.theme.colors.darkBlue};
            border-color: ${(p) => p.theme.colors.brightBlue};
        }
    }

    .CookieConsentButtonDecline {
        background: ${(p) => p.theme.colors.black};
        border: ${(p) => p.theme.borderWidths.thin} solid ${(p) => p.theme.colors.mediumGray};
        margin-bottom: ${(p) => p.theme.space.xl};
        &:hover {
            border-color: ${(p) => p.theme.colors.muted};
            background: ${(p) => p.theme.colors.black};
        }
        &:active {
            background: ${(p) => p.theme.colors.darkBlue};
            border-color: ${(p) => p.theme.colors.darkBlue};
        }
    }
`

const StyledButtonClose = styled.div`
    cursor: pointer;
    padding: ${(p) => p.theme.space.zero} ${(p) => p.theme.space.sm};
    ${(p) => mediaqueries.desktop_up`
        padding: ${p.theme.space.zero};
    `};
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
