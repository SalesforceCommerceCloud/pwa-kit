import styled from '@emotion/styled'
import PropTypes from 'prop-types'
import React from 'react'
import CopyToClipboard from './icons/CopyToClipboard.svg'

const ButtonCopyToClipboard = ({onClick, children, title = ''}) => {
    return (
        <WrapperButtonCopyToClipboard>
            <StyleHeadingCopyButton>{title}</StyleHeadingCopyButton>
            <StyledButtonCopyToClipboard onClick={onClick} aria-label="Copy code" title="Copy code">
                <span>
                    <span style={iconStyleCopyButton}>
                        <img src={CopyToClipboard} alt="copy" />
                    </span>
                    {children}
                </span>
            </StyledButtonCopyToClipboard>
        </WrapperButtonCopyToClipboard>
    )
}

const StyleHeadingCopyButton = styled.div`
    font-size: ${(p) => p.theme.fontSizes[1]}px;
    color: ${(p) => p.theme.colors.white};
    font-weight: ${(p) => p.theme.fontWeights.bold};
    font-family: ${(p) => p.theme.fonts.heading};
`

const iconStyleCopyButton = {
    marginRight: '5px',
    verticalAlign: 'middle'
}

const StyledButtonCopyToClipboard = styled.button`
    background: ${(p) => p.theme.colors.mediumSilver};
    color: ${(p) => p.theme.colors.black};
    cursor: pointer;
    padding: ${(p) => p.theme.space.xs} ${(p) => p.theme.space.sm};
    font-size: ${(p) => p.theme.fontSizes.sm};
    border-radius: ${(p) => p.theme.radii.sm};
    letter-spacing: 0.5px;
    font-weight: ${(p) => p.theme.fontWeights.bold};
    text-align: center;
    margin-left: auto;
    outline: 0;
    position: sticky;
    right: ${(p) => p.theme.space.md};

    &:hover {
        background: ${(p) => p.theme.colors.lightSilver};
    }
`

const WrapperButtonCopyToClipboard = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    border-bottom: ${(p) => p.theme.borderWidths.thin} solid ${(p) => p.theme.colors.silver};
    padding: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.md};
    background-color: ${(p) => p.theme.colors.black};
`
ButtonCopyToClipboard.propTypes = {
    onClick: PropTypes.func,
    children: PropTypes.string,
    title: PropTypes.string
}

export default ButtonCopyToClipboard
