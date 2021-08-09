/** @jsx jsx */
import {jsx} from 'theme-ui'
import React from 'react'
import PropTypes from 'prop-types'
import mediaqueries from '../styles/media'
import styled from '@emotion/styled'
import theme from '../gatsby-plugin-theme-ui'

const TopBanner = ({className}) => {
    return (
        <StyledBannerTopWrapper className={className}>
            <StyledBannerTopContent>
                These are the docs for v1.
                <StyledNavLinks href="https://dev.mobify.com">View the v2 docs 👉</StyledNavLinks>
            </StyledBannerTopContent>
        </StyledBannerTopWrapper>
    )
}

const StyledBannerTopContent = styled.div`
    max-width: ${(p) => p.theme.maxPageWidth};
    margin: 0 auto;
    flex: 1;
    display: flex;
    justify-content: left;
    align-items: center;
    text-align: left;
    padding: 0 ${(p) => p.theme.space.xl}; // 0 24px

    ${(p) => mediaqueries.tablet`
        flex-direction: column;
        align-items: start;
        padding: 0  ${p.theme.space.sm};
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

const StyledBannerTopWrapper = styled.div`
    font-family: ${(p) => p.theme.fonts.heading};
    padding: ${(p) => p.theme.space.sm};
    color: ${(p) => p.theme.colors.white};
    background-color: ${(p) => p.theme.colors.black};
    text-align: left;
    display: flex;
    align-items: start;
    justify-content: flex-start;
    z-index: ${(p) => p.theme.zIndices.z2Depth};
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
