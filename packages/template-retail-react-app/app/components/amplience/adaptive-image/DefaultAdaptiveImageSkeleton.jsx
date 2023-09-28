import React from 'react'
import PropTypes from 'prop-types'
import {withStyles} from '@material-ui/core'
import {Skeleton} from '@chakra-ui/react'
import clsx from 'clsx'

const styles = () => {
    return {
        root: {
            position: 'relative',
            paddingBottom: '50%',

            ['@media (max-width: 768px)']: {
                paddingBottom: '100%'
            },
            ['@media (min-width: 768px)']: {
                paddingBottom: '66%'
            },
            ['@media (min-width: 1024px)']: {
                paddingBottom: '50%'
            }
        }
    }
}

/* interface Props extends WithStyles<typeof styles> {
    className?: string;
    style?: React.CSSProperties
} */

const DefaultAdaptiveImageSkeleton = (props) => {
    const {classes, className, ...other} = props

    return <Skeleton className={clsx(classes.root, className)} {...other} />
}

DefaultAdaptiveImageSkeleton.displayName = 'DefaultAdaptiveImageSkeleton'

DefaultAdaptiveImageSkeleton.propTypes = {
    classes: PropTypes.string,
    className: PropTypes.object
}

export default withStyles(styles)(DefaultAdaptiveImageSkeleton)
