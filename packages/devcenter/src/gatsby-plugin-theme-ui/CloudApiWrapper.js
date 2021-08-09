import React from 'react'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'

CloudApiWrapper.propTypes = {
    children: PropTypes.array
}

function CloudApiWrapper(props) {
    return <StyledCloudApiWrapper>{props.children}</StyledCloudApiWrapper>
}

const StyledCloudApiWrapper = styled.div`
    p {
        font-size: ${(p) => p.theme.fontSizes.md};
        margin-top: ${(p) => p.theme.space.md};
        margin-bottom: ${(p) => p.theme.space.md};
    }

    code {
        color: ${(p) => p.theme.colors.black};
        background-color: ${(p) => p.theme.colors.lightSilver};
        font-size: ${(p) => p.theme.fontSizes.md};
        font-family: ${(p) => p.theme.fonts.monospace};
        padding: ${(p) => p.theme.space.xxs} ${(p) => p.theme.space.xs};
        border-radius: ${(p) => p.theme.radii.sm};
    }
`

export default CloudApiWrapper
