import React from 'react'
import PropTypes from 'prop-types'
import {Box, Heading} from '@chakra-ui/react'
import {Helmet} from 'react-helmet'
import {useIntl} from 'react-intl'

const NotFoundPage = (props) => {
    const intl = useIntl()
    console.log('props', props)
    return (
        <Box
            layerStyle="page"
            className="404-not-found"
            height={'100%'}
            padding={{lg: 8, sm: 6, base: 0}}
        >
            <Helmet>
                <title>
                    {intl.formatMessage({defaultMessage: "Sorry, we couldn't find this page"})}
                </title>
            </Helmet>

            <Box h="100%" bgColor="gray.50">
                <Heading as="h4" size="md">
                    {intl.formatMessage({
                        defaultMessage: "Sorry, we couldn't find this page"
                    })}
                </Heading>
            </Box>
        </Box>
    )
}

NotFoundPage.propTypes = {}

export default NotFoundPage
