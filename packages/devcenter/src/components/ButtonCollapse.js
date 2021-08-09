import styled from '@emotion/styled'
import PropTypes from 'prop-types'
import React from 'react'
import Add from './icons/Add'
import Icon from './icons/Icon'
import Minimize from './icons/Minimize'

const ButtonCollapse = ({onClick, isCollapsed}) => {
    return (
        <StyledButtonCollapse
            onClick={onClick}
            aria-label="Toggle Subnavigation"
            title="Toggle Subnavigation"
        >
            {isCollapsed ? (
                <Icon icon={<Add />} size={20} />
            ) : (
                <Icon icon={<Minimize />} size={20} />
            )}
        </StyledButtonCollapse>
    )
}

const StyledButtonCollapse = styled.button`
    background: none;
    border: 0;
    color: ${(p) => p.theme.colors.text};
    cursor: pointer;
    padding: ${(p) => p.theme.space.zero} ${(p) => p.theme.space.sm};
    padding-right: ${(p) => p.theme.space.zero};
    font-size: ${(p) => p.theme.fontSizes.md};
`

ButtonCollapse.propTypes = {
    onClick: PropTypes.func.isRequired,
    isCollapsed: PropTypes.bool
}

export default ButtonCollapse
