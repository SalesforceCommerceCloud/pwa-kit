import styled from '@emotion/styled'
import React from 'react'
import PropTypes from 'prop-types'
import Icon from './Icon'

const IconButton = ({onClick, label, icon, size}) => {
    return (
        <StyledIconButton type="button" onClick={onClick} aria-label={label} title={label}>
            <Icon icon={icon} size={size} />
        </StyledIconButton>
    )
}

const StyledIconButton = styled.button`
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
`

IconButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    label: PropTypes.string,
    icon: PropTypes.element,
    size: PropTypes.number.isRequired,
}

export default IconButton
