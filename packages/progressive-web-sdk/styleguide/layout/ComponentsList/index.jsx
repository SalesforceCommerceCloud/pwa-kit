import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import ToolbarButton from 'react-styleguidist/lib/rsg-components/ToolbarButton'
import Styled from 'react-styleguidist/lib/rsg-components/Styled'

const styles = ({color, fontFamily, fontSize, space, mq}) => ({
    list: {
        margin: 0,
        paddingLeft: space[2]
    },
    item: {
        color: color.base,
        display: 'block',
        margin: [[space[1], 0, space[1], 0]],
        fontFamily: fontFamily.base,
        fontSize: fontSize.base,
        listStyle: 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    isChild: {
        [mq.small]: {
            display: 'inline-block',
            margin: [[0, space[1], 0, 0]]
        }
    },
    heading: {
        color: color.base,
        marginTop: space[1],
        fontFamily: fontFamily.base,
        fontWeight: 'bold'
    }
})

// eslint-disable-next-line func-style
export function ComponentsListRenderer({classes, items}) {
    items = items.filter((item) => item.name)

    if (!items.length) {
        return null
    }

    const clickHander = () => {
        if (window && window.scrollY > 0) {
            window.scrollTo(0, 0)
        }
    }

    // Disabling a11y lints because I am relying on bubbling. The UL is not the
    // element being interacted with.
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-focus, jsx-a11y/onclick-has-role
        <ul className={classes.list} onClick={clickHander}>
            {items.map(({heading, name, content}) => {
                const isNotContent =
                    !content || (content.props.items && !content.props.items.length)

                return (
                    <li className={cx(classes.item, isNotContent && classes.isChild)} key={name}>
                        <ToolbarButton
                            className={cx(heading && classes.heading)}
                            href={`#!/${name}`}
                        >
                            {name}
                        </ToolbarButton>

                        {content}
                    </li>
                )
            })}
        </ul>
    )
}

ComponentsListRenderer.propTypes = {
    classes: PropTypes.object.isRequired,
    items: PropTypes.array.isRequired
}

export default Styled(styles)(ComponentsListRenderer) // eslint-disable-line new-cap
