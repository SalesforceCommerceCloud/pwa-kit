import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Image, Text, AspectRatio } from '@chakra-ui/react';

const Carousel2 = ({ items, interval = 2000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, interval);
        return () => clearInterval(timer);
    }, [items.length, interval]);

    return (
        <AspectRatio ratio={1} w="100%">
            <Box position="relative" w="100%" h="100%" overflow="hidden">
                {items.map((item, index) => (
                    <Box
                        key={index}
                        position="absolute"
                        top={0}
                        left="50%"
                        transform="translateX(-50%)"
                        w="100%"
                        h="100%"
                        opacity={index === currentIndex ? 1 : 0}
                        transition="opacity 0.1s ease-in-out"
                    >
                        <Image
                            src={item.image}
                            alt={item.text}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                        />
                        <Text
                            position="absolute"
                            bottom="4"
                            left="50%"
                            transform="translateX(-50%)"
                            color="white"
                            fontSize="xl"
                            bg="rgba(0, 0, 0, 0.4)"
                            px={4}
                            py={2}
                            borderRadius="md"
                        >
                            {item.text}
                        </Text>
                    </Box>
                ))}
            </Box>
        </AspectRatio>
    );
};

Carousel2.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            image: PropTypes.string.isRequired
        })
    ).isRequired,
    interval: PropTypes.number
};

export default Carousel2;