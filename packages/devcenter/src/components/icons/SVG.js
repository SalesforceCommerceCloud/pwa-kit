import styled from '@emotion/styled'
import React from 'react'

const SVG = ({children, viewBox, fill = 'black', stroke, strokeWidth}) => (
    <StyledSVG
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
    >
        {children}
    </StyledSVG>
)

const StyledSVG = styled.svg`
    fill: ${(p) => p.fill};
    stroke: ${(p) => p.stroke};
    stroke-width: ${(p) => p.strokeWidth};
    transition: all ${(p) => p.theme.transition};
`

export default SVG
