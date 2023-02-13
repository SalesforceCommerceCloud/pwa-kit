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
} from '@chakra-ui/react'
import {Component} from 'commerce-sdk-react-preview/components'
import {ChevronLeftIcon, ChevronRightIcon} from '../../icons'

const Carousel = (props = {}) => {
    const scrollRef = useRef()

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
        base: `calc(${100 / xsCarouselSlidesToDisplay}%)`,
        sm: `calc(${100 / smCarouselSlidesToDisplay}%)`,
        md: `calc(${100 / mdCarouselSlidesToDisplay}%)`
    }

    // Scroll the container left or right by 100%. Passing no args or `1`
    // scrolls to the right, and passing `-1` scrolls left.
    const scroll = (direction = 1) => {
        scrollRef.current?.scrollBy({
            top: 0,
            left: (direction * window.innerWidth) / regions[0].components.length,
            behavior: 'smooth'
        })
    }

    const css = `
        ::-webkit-scrollbar {
            -webkit-appearance: none;
            width: 7px;
        }

        ::-webkit-scrollbar-thumb {
            border-radius: 4px;
            background-color: rgba(0,0,0,.5);
            -webkit-box-shadow: 0 0 1px rgba(255,255,255,.5);
        }
    `
    return (
        <Box position="relative" data-testid="experience-carousel">
            <style>
                {css}
            </style>
            <Stack spacing={6}>
                {textHeadline && (
                    <Heading as="h2" fontSize="xl" textAlign="center">
                        {textHeadline}
                    </Heading>
                )}

                <Stack
                    ref={scrollRef}
                    direction="row"
                    spacing={0}
                    wrap="nowrap"
                    overflowX="scroll"
                    sx={{
                        scrollPadding: 0,
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {regions[0].components.map((component, index) => (
                        <Box
                            key={component?.id || index}
                            flex="0 0 auto"
                            width={itemWidth}
                            style={{scrollSnapAlign: 'start', border: '1px solid black'}}
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
                    id="dots"
                    position="absolute"
                    bottom="10px"
                    left="50%"
                    transform="translateX(-50%)"
                    style={{borderRadius: '10px', height: '30px', lineHeight: '20px', background: 'rgba(0, 0, 0, 0.5)'}}
                >
                    {regions[0].components.map((component, index) => (
                        <a style={{fontSize: "50px", color: "white", opacity: "0.5"}} onClick={() => scroll(-1)}>&#x2022;</a>
                    ))}
                </Box>
            </>

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
