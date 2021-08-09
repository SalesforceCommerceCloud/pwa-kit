import styled from '@emotion/styled'
import PropTypes from 'prop-types'
import React from 'react'

const Icon = ({icon, size}) => <StyledIcon size={size}>{icon}</StyledIcon>

const StyledIcon = styled.span`
    display: inline-block;
    width: ${(p) => `${p.size}px`};
    height: ${(p) => `${p.size}px`};
`

Icon.propTypes = {
    icon: PropTypes.element.isRequired,
    size: PropTypes.number.isRequired,
}

export default Icon
