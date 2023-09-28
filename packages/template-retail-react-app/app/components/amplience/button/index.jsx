import React from 'react'
import PropTypes from 'prop-types'
import {Button as Btn, Link} from '@chakra-ui/react'

/**
 * Button component cound be used anywhere
 */
const Button = ({label, url, ...props}) => {
    return label && url ? (
        <Btn
            as={Link}
            href={url}
            width={{base: 'full', md: 'inherit'}}
            paddingX={7}
            _hover={{textDecoration: 'none'}}
            {...props}
        >
            {label}
        </Btn>
    ) : (
        <></>
    )
}

Button.displayName = 'Button'

Button.propTypes = {
    label: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
}

export default Button
