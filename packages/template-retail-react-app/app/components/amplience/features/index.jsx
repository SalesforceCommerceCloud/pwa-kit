import React from 'react'
import {Text, Image, useTheme} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {Box, Container, SimpleGrid, VStack, HStack, Flex} from '@chakra-ui/layout'
import {getImageUrl} from '../../../utils/amplience/image'
import Link from '../link'
import {getLinkUrlEnum} from '../../../utils/amplience/link'
import Section from '../../section'

const Features = ({features, render}) => {
    const theme = useTheme()

    const {iconBaseStyle} = theme.components.Icon

    const buttonMode = render === 'Buttons'

    return buttonMode ? (
        <Section
            background={'gray.50'}
            marginX="auto"
            paddingY={{base: 8, md: 16}}
            paddingX={{base: 4, md: 8}}
            borderRadius="base"
            width={{base: '100vw', md: 'inherit'}}
            position={{base: 'relative', md: 'inherit'}}
            left={{base: '50%', md: 'inherit'}}
            right={{base: '50%', md: 'inherit'}}
            marginTop="8"
            marginBottom="8"
            marginLeft={{base: '-50vw', md: 'auto'}}
            marginRight={{base: '-50vw', md: 'auto'}}
        >
            <SimpleGrid
                columns={{base: 1, md: 1, lg: 3}}
                spacingX={{base: 1, md: 4}}
                spacingY={{base: 4, md: 14}}
            >
                {features.map((feature, index) => {
                    const contents = (
                        <HStack>
                            <Flex paddingLeft={6} height={24} align={'center'} justify={'center'}>
                                <Image
                                    {...iconBaseStyle}
                                    maxWidth="12"
                                    maxHeight="12"
                                    src={getImageUrl(feature.icon)}
                                    alt={feature.title || feature.text || feature.link?.label}
                                ></Image>
                            </Flex>
                            <Text fontWeight="700">{feature.title ?? feature.link.label}</Text>
                        </HStack>
                    )

                    return (
                        <Box
                            key={index}
                            background={'white'}
                            boxShadow={'0px 2px 2px rgba(0, 0, 0, 0.1)'}
                            borderRadius={'4px'}
                        >
                            {feature.link && feature.link.value ? (
                                <Link target="_blank" to={getLinkUrlEnum(feature.link)}>
                                    {contents}
                                </Link>
                            ) : (
                                contents
                            )}
                        </Box>
                    )
                })}
            </SimpleGrid>
        </Section>
    ) : (
        <Container maxW={'6xl'} marginTop={10}>
            <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={10}>
                {features.map((feature, index) => {
                    return (
                        <HStack key={index} align={'top'}>
                            <VStack align={'start'}>
                                <Flex
                                    width={16}
                                    height={16}
                                    align={'center'}
                                    justify={'left'}
                                    color={'gray.900'}
                                    paddingX={2}
                                >
                                    <Image
                                        {...iconBaseStyle}
                                        src={getImageUrl(feature.icon)}
                                        alt={feature.title || feature.text || feature.link?.label}
                                    ></Image>
                                </Flex>
                                <Text color={'black'} fontWeight={700} fontSize={20}>
                                    {feature.title}
                                </Text>
                                <Text color={'black'}>{feature.text}</Text>
                                {feature.link && feature.link.value && (
                                    <Link to={getLinkUrlEnum(feature.link)} alignSelf="end">
                                        {feature.link.label}
                                    </Link>
                                )}
                            </VStack>
                        </HStack>
                    )
                })}
            </SimpleGrid>
        </Container>
    )
}

Features.displayName = 'Features'
Features.propTypes = {
    render: PropTypes.string,
    features: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string,
            text: PropTypes.string,
            value: PropTypes.string,
            icon: PropTypes.shape({
                defaultHost: PropTypes.string,
                endpoint: PropTypes.string,
                id: PropTypes.string,
                name: PropTypes.string,
                _meta: PropTypes.shape({
                    schema: PropTypes.string
                })
            }),
            link: PropTypes.object
        })
    )
}

export default Features
