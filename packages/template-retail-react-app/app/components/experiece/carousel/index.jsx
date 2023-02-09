/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef} from 'react'
import PropTypes from 'prop-types'
import {
    AspectRatio,
    Box,
    Heading,
    IconButton,
    Stack
    // Skeleton,
    // useBreakpoint
} from '@chakra-ui/react'
import {Component} from 'commerce-sdk-react-preview/components'
import {ChevronLeftIcon, ChevronRightIcon} from '../../icons'

const Carousel = (props = {}) => {
    const scrollRef = useRef()
    // const breakpoint = useBreakpoint()

    const {
        textHeadline,
        regions,
        // eslint-disable-next-line no-unused-vars
        xsCarouselIndicators = false,
        // eslint-disable-next-line no-unused-vars
        smCarouselIndicators = false,
        // eslint-disable-next-line no-unused-vars
        mdCarouselIndicators = false,
        xsCarouselControls = false,
        smCarouselControls = false,
        xsCarouselSlidesToDisplay = 1,
        smCarouselSlidesToDisplay = 1,
        mdCarouselSlidesToDisplay = 1
    } = props

    const controlDisplay = {
        base: 'none',
        sm: xsCarouselControls ? 'block' : 'none',
        md: smCarouselControls ? 'block' : 'none',
        lg: 'block'
    }

    const itemWidth = {
        base: `calc(${100 / xsCarouselSlidesToDisplay}% - 10px)`,
        sm: `calc(${100 / smCarouselSlidesToDisplay}% - 10px)`,
        md: `calc(${100 / mdCarouselSlidesToDisplay}% - 10px)`
    }

    // Scroll the container left or right by 100%. Passing no args or `1`
    // scrolls to the right, and passing `-1` scrolls left.
    const scroll = (direction = 1) => {
        scrollRef.current?.scrollBy({
            top: 0,
            left: direction * window.innerWidth,
            behavior: 'smooth'
        })
    }

    return (
        <Box position="relative" data-testid="experience-carousel">
            <Stack spacing={6}>
                {textHeadline && (
                    <Heading as="h2" fontSize="xl" textAlign="center">
                        {textHeadline}
                    </Heading>
                )}

                <Stack
                    ref={scrollRef}
                    direction="row"
                    spacing={4}
                    wrap="nowrap"
                    overflowX="scroll"
                    px={{base: 4, md: 8, lg: 0}}
                    sx={{
                        scrollPadding: {base: 16, md: 32, lg: 0},
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {regions[0].components.map((component, index) => (
                        <Box
                            key={component?.id || index}
                            flex="0 0 auto"
                            width={itemWidth}
                            style={{scrollSnapAlign: 'start'}}
                        >
                            <AspectRatio ratio={1}>
                                <Component component={{...component, index}} />
                            </AspectRatio>
                        </Box>
                    ))}
                </Stack>
            </Stack>

            <>
                <Box
                    display={controlDisplay}
                    position="absolute"
                    top="50%"
                    left={{base: 0, lg: 4}}
                    transform="translateY(-50%)"
                >
                    <IconButton
                        data-testid="product-scroller-nav-left"
                        aria-label="Scroll products left"
                        icon={<ChevronLeftIcon color="black" />}
                        borderRadius="full"
                        colorScheme="whiteAlpha"
                        onClick={() => scroll(-1)}
                    />
                </Box>

                <Box
                    display={controlDisplay}
                    position="absolute"
                    top="50%"
                    right={{base: 0, lg: 4}}
                    transform="translateY(-50%)"
                >
                    <IconButton
                        data-testid="product-scroller-nav-right"
                        aria-label="Scroll products right"
                        icon={<ChevronRightIcon color="black" />}
                        borderRadius="full"
                        colorScheme="whiteAlpha"
                        onClick={() => scroll(1)}
                    />
                </Box>
            </>
        </Box>
    )
}

Carousel.propTypes = {
    textHeadline: PropTypes.string,
    regions: PropTypes.array,
    xsCarouselIndicators: PropTypes.bool,
    smCarouselControls: PropTypes.bool,
    mdCarouselIndicators: PropTypes.bool,
    xsCarouselControls: PropTypes.bool,
    smCarouselIndicators: PropTypes.bool,
    xsCarouselSlidesToDisplay: PropTypes.number,
    mdCarouselSlidesToDisplay: PropTypes.number,
    smCarouselSlidesToDisplay: PropTypes.number
}

export default Carousel
