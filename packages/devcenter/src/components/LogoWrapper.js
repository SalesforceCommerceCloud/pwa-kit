import styled from '@emotion/styled'
import {Link} from 'gatsby'
import React from 'react'
import logo from '../images/logo-devcenter.svg'

const LogoWrapper = ({onClick}) => {
    return (
        <LogoLink to="/" onClick={onClick}>
            <Img src={logo} alt="Mobify DevCenter" />
        </LogoLink>
    )
}

const LogoLink = styled(Link)`
    display: block;
    text-decoration: none;
    height: ${(p) => p.theme.logoHeight};
    outline-color: ${(p) => p.theme.colors.lightTransparent};
    outline-width: ${(p) => p.theme.borderWidths.thin};
`

const Img = styled.img`
    height: ${(p) => p.theme.logoHeight};
`
export default LogoWrapper
