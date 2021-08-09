/** @jsx jsx */
import {jsx} from 'theme-ui'
import React, {useContext, useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import mediaqueries from '../styles/media'
import styled from '@emotion/styled'
import CloseIcon from './icons/Close.svg'
import theme from '../gatsby-plugin-theme-ui'
import {GlobalDispatchContext, GlobalStateContext} from '../context/GlobalContextProvider'

const TopBanner = ({className}) => {
    const topBannerRef = useRef(null)

    useEffect(() => {
        if (topBannerRef.current) {
            dispatch({
                type: 'SET_BANNER_HEIGHT',
                bannerHeight: topBannerRef.current.clientHeight
            })
        } else {
            dispatch({
                type: 'SET_BANNER_HEIGHT',
                bannerHeight: 0
            })
        }
    }, [topBannerRef])

    const state = useContext(GlobalStateContext)
    const dispatch = useContext(GlobalDispatchContext)

    const hide = () => {
        document.documentElement.style.setProperty(
            '--top-spacing-right-sidebar',
            theme.headerHeightRightSidebar
        )
        document.documentElement.style.setProperty('--top-spacing-scroll-padding-top', `0px`)

        dispatch({
            type: 'CLOSE_TOP_BANNER'
        })
    }

    return (
        <div>
            {state.topBanner && (
                <StyledBannerTopWrapper ref={topBannerRef} className={className}>
                    <StyledBannerTopContent>
                        🎉 Welcome to the Mobify DevCenter, our new home for v2.x documentation and
                        developer resources!{' '}
                        <StyledNavLinks href="https://docs.mobify.com">
                            Switch to v1.x site
                        </StyledNavLinks>
                    </StyledBannerTopContent>
                    <StyledButtonClose onClick={hide} className="notification-banner-button">
                        <span>
                            <span style={iconStyleCloseButton}>
                                <img src={CloseIcon} alt="close" />
                            </span>
                        </span>
                    </StyledButtonClose>
                </StyledBannerTopWrapper>
            )}
        </div>
    )
}

const iconStyleCloseButton = {
    margin: '0 16px',
    verticalAlign: 'middle'
}

const StyledBannerTopContent = styled.div`
    flex: 1;
    display: flex;
    justify-content: left;
    align-items: start;
    transform: ${(p) => `translateX(${p.theme.space.md})`}; // Close icon width
    flex-direction: column;
    text-align: left;
    ${mediaqueries.desktop_up`
            flex-direction: row;
            align-items: center;
    `};
    ${mediaqueries.desktop_medium_up`
            flex-direction: row;
            text-align: center;
            justify-content: center;
    `};
`

const StyledNavLinks = styled.a`
    text-decoration: none;
    cursor: pointer;
    color: ${(p) => p.theme.colors.white};
    padding-top: ${(p) => p.theme.space.md};
    margin: ${(p) => p.theme.space.zero} ${(p) => p.theme.space.zero} ${(p) => p.theme.space.sm}
        ${(p) => p.theme.space.zero};
    border-bottom: ${(p) => p.theme.borderWidths.thin} solid white;
    white-space: nowrap;
    ${mediaqueries.desktop_up`
        border: ${theme.borderWidths.thinnest} solid white;
        padding: ${theme.space.xs} ${theme.space.md};
        margin: 0 10px;
        border-radius: ${theme.radii.sm};
    `};
`

const StyledButtonClose = styled.div`
    cursor: pointer;
    margin-left: auto;
    margin-right: ${(p) => p.theme.space.sm};
    padding: ${(p) => p.theme.space.sm};
`

const StyledBannerTopWrapper = styled.div`
    font-family: ${(p) => p.theme.fonts.heading};
    padding: ${(p) => p.theme.space.sm};
    color: ${(p) => p.theme.colors.white};
    background-color: ${(p) => p.theme.colors.black};
    text-align: left;
    display: flex;
    align-items: start;
    justify-content: left;
    z-index: ${(p) => p.theme.zIndices.z2Depth};
    margin: 0;
    ${mediaqueries.desktop_up`
        margin-left: calc(50% - 50vw);
        margin-right: calc(50% - 50vw);
        text-align: center;
        align-items: center;
        justify-content: center;
    `};
`

TopBanner.propTypes = {
    className: PropTypes.string
}

export default TopBanner
