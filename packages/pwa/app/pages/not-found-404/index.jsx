import React from 'react'
import PropTypes from 'prop-types'
import {Box, Heading, Flex, Button} from '@chakra-ui/react'
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

            <Flex h="100%" bgColor="gray.50" justify="center" align="center" flexDirection="column">
                <Heading as="h2" fontSize={['sm', 'md', 'xl', '3xl']} mb={2}>
                    {intl.formatMessage({
                        defaultMessage: "Sorry, we couldn't find this page"
                    })}
                </Heading>
                <Box>
                    {intl.formatMessage({
                        defaultMessage:
                            'We’ve move a lot of stuff around, and it must’ve gotten lost in the mix. '
                    })}
                </Box>
                <Box mb={12}>
                    {intl.formatMessage({
                        defaultMessage:
                            'Please try retyping the address, head back to the previous page or go home.'
                    })}
                </Box>
                <Flex>
                    <Button>
                        {intl.formatMessage({
                            defaultMessage: 'Back to previous page'
                        })}
                    </Button>
                    <Button variant="outline">
                        {intl.formatMessage({
                            defaultMessage: 'Go to home page'
                        })}
                    </Button>
                </Flex>
            </Flex>
        </Box>
    )
}

NotFoundPage.propTypes = {}

export default NotFoundPage
