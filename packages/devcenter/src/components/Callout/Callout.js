import React from 'react'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'
import InfoIcon from '../icons/Info.svg'
import WarningIcon from '../icons/Warning.svg'

const calloutType = (props) => {
    return {
        info: {
            background: props.theme.colors.lightBlue,
            boxShadowColor: props.theme.colors.blue,
            icon: InfoIcon
        },
        warning: {
            background: props.theme.colors.lightRed,
            boxShadowColor: props.theme.colors.alert,
            icon: WarningIcon
        }
        // add more callout styling here
    }
}
const Callout = ({children, className, ...props}) => (
    <StyledCalloutWrapper className={className} {...props}>
        {children}
    </StyledCalloutWrapper>
)

const StyledCalloutWrapper = styled.div({}, (props) => {
    const {
        theme: {fontSizes, calloutIconSize, space, colors, borderWidths},
        type
    } = props
    return {
        fontSize: fontSizes.body,
        paddingTop: space.md,
        paddingRight: space.xxl,
        paddingBottom: space.md,
        paddingLeft: space.xxxl,
        marginBottom: space.md,
        color: colors.text,
        backgroundColor: calloutType(props)[type].background,
        boxShadow: `-${borderWidths.highlight} 0 0 0 ${calloutType(props)[type].boxShadowColor}`,

        ':before': {
            background: `url(${calloutType(props)[props.type].icon})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: calloutIconSize,
            height: calloutIconSize,
            width: calloutIconSize,
            content: "''",
            float: 'left',
            marginLeft: `-${space.xxl}`,
            marginTop: '1px'
        },

        ':after': {
            content: "''",
            clear: 'both',
            display: 'table'
        },
        '& p:first-of-type': {
            marginTop: 0
        },
        '& p:last-of-type': {
            marginBottom: 0
        }
    }
})

Callout.propTypes = {
    children: PropTypes.element.isRequired,
    className: PropTypes.string.isRequired
}

export default Callout
