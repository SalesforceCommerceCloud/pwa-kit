import React from 'react'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'

JSDocWrapper.propTypes = {
    children: PropTypes.array
}

function JSDocWrapper(props) {
    return <StyledJSDocWrapper>{props.children}</StyledJSDocWrapper>
}

const StyledJSDocWrapper = styled.div`
    h2 {
        padding-top: ${(p) => p.theme.space.mid};
    }

    hr {
        margin-block-start: ${(p) => p.theme.space.xxl};
        margin-block-end: ${(p) => p.theme.space.md};
    }

    h4 {
        font-family: ${(p) => p.theme.fonts.monospace};
    }

    .jsdoc-kind {
        background-color: ${(p) => p.theme.colors.purple};
        color: ${(p) => p.theme.colors.white};
        padding: ${(p) => p.theme.space.xs} ${(p) => p.theme.space.sm};
        border-radius: ${(p) => p.theme.radii.sm};
        text-transform: uppercase;
        font-weight: 700;
        font-size: ${(p) => p.theme.fontSizes[0]}px;
        display: inline-block;
        margin-top: ${(p) => p.theme.space.lg};
    }

    .jsdoc-kind {
        background-color: ${(p) => p.theme.colors.purple};
        color: ${(p) => p.theme.colors.white};
        padding: ${(p) => p.theme.space.xs} ${(p) => p.theme.space.sm};
        border-radius: ${(p) => p.theme.radii.sm};
        text-transform: uppercase;
        font-weight: 700;
        margin-top: ${(p) => p.theme.space.xl};
        display: inline-block;
        font-size: ${(p) => p.theme.fontSizes[0]}px;
    }

    .jsdoc-throws,
    .jsdoc-returns,
    .jsdoc-implements {
        margin-bottom: ${(p) => p.theme.space.xxl};
    }

    .jsdoc-returns p,
    .jsdoc-throws p,
    .jsdoc-implements p {
        margin: ${(p) => p.theme.space.sm} 0;
    }

    hr: last-of-type {
        display: none;
    }

    .jsdoc__module-name {
        background: ${(p) => p.theme.colors.lightSilver};
        font-family: Monaco, sans-serif;
        padding: 0 ${(p) => p.theme.space.sm};
        margin-bottom: ${(p) => p.theme.space.xxl};
        overflow: auto;
    }
`

export default JSDocWrapper
