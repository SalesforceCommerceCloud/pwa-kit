import React from 'react'
import PropTypes from 'prop-types'
import Styled from 'react-styleguidist/lib/rsg-components/Styled'

const styles = ({space, color, fontFamily, fontSize, borderRadius}) => ({
    root: {
        fontFamily: fontFamily.base
    },
    search: {
        padding: space[2]
    },
    input: {
        display: 'block',
        width: '100%',
        padding: space[1],
        color: color.base,
        backgroundColor: color.baseBackground,
        fontFamily: fontFamily.base,
        fontSize: fontSize.base,
        border: [[1, color.border, 'solid']],
        borderRadius,
        transition: 'border-color ease-in-out .15s',
        '&:focus': {
            isolate: false,
            borderColor: color.link,
            outline: 0
        },
        '&::placeholder': {
            isolate: false,
            fontFamily: fontFamily.base,
            fontSize: fontSize.base,
            color: color.light
        }
    }
})

// eslint-disable-next-line func-style
export function TableOfContentsRenderer({classes, children}) {
    return <div className={classes.root}>{children}</div>
}

TableOfContentsRenderer.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node
}

export default Styled(styles)(TableOfContentsRenderer) // eslint-disable-line new-cap
