import React from 'react'
import PropTypes from 'prop-types'
import {Box, Flex, Stack, Image} from '@chakra-ui/react'
import Button from '../button'
import {getImageUrl} from '../../../utils/amplience/image'

const NavigationHero = ({title, img, actions, fullWidth, ...props}) => {
    let src = ''
    let alt = ''
    if (img) {
        src = getImageUrl(img.image)
        alt = img.alt
    }

    return (
        <Box marginBottom={{base: 0}} height={{lg: 'xs'}} position={{lg: 'relative'}} {...props}>
            <Stack
                align={'center'}
                spacing={{base: 2}}
                paddingTop={{base: 4}}
                paddingBottom={{base: 2}}
                direction={{base: 'column'}}
            >
                {src && (
                    <Flex
                        flex={1}
                        justify={'center'}
                        align={'center'}
                        position={'relative'}
                        width={'full'}
                        paddingTop={{base: 2}}
                    >
                        <Box position={'relative'}>
                            <Image
                                fit={'cover'}
                                align={'center'}
                                width={'100%'}
                                height={'100%'}
                                src={src}
                                alt={alt}
                            />
                        </Box>
                        {actions && (
                            <Box position={'absolute'}>
                                <Button label={actions[0].label} url={actions[0].url}></Button>
                            </Box>
                        )}
                    </Flex>
                )}
            </Stack>
        </Box>
    )
}

NavigationHero.displayName = 'NavigationHero'

NavigationHero.propTypes = {
    /**
     * Hero component image
     */
    img: PropTypes.shape({
        image: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
            endpoint: PropTypes.string,
            defaultHost: PropTypes.string
        }),
        alt: PropTypes.string
    }),
    /**
     * Hero component main title
     */
    // title: PropTypes.string,
    title: PropTypes.string,
    /**
     * Call to action component(s)
     */
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            url: PropTypes.string
        })
    ),
    /**
     * Hero fullWidth property
     */
    fullWidth: PropTypes.bool
}

export default NavigationHero
