import React from 'react'
import PropTypes from 'prop-types'
import {Box, Text, Heading, Flex, Center, useMultiStyleConfig, Icon} from '@chakra-ui/react'
import Link from '../link'
import styled from '@emotion/styled'
import {LinkIcon} from '@chakra-ui/icons'

const Contain = styled(Link)`
    .text-box {
        padding-left: 20px;
    }
    @media (max-width: 768px) {
        .flex-pane {
            flex-direction: column;
        }
        .text-box {
            padding: 20px 0 0 0;
        }
    }
    &:hover {
        text-decoration: none;
        h2 {
            //text-decoration: underline;
        }
        > div {
            background: rgba(245, 245, 245, 0.9);
            border-color: #aaa;
        }
    }
`

const PageTile = ({page}) => {
    const styles = useMultiStyleConfig('ContentTile')
    return (
        <Contain to={'/' + page._meta.deliveryKey}>
            <Box {...styles.tile}>
                <Flex className="flex-pane" flexDirection={{sm: 'column', md: 'row'}}>
                    <Center>
                        <Icon as={LinkIcon} boxSize={'1.5em'} />
                    </Center>
                    <Box className="text-box">
                        <Heading as={'h2'} {...styles.title} fontSize="lg">
                            {page.seo.title}
                        </Heading>
                        <Text {...styles.blurb} noOfLines={1}>
                            {page.seo.description}
                        </Text>
                    </Box>
                </Flex>
            </Box>
        </Contain>
    )
}

PageTile.propTypes = {
    page: PropTypes.object
}

export default PageTile
