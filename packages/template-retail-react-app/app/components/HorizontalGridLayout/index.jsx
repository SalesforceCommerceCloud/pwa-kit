import React from 'react';
import { Box } from '@chakra-ui/react';

const HorizontalGridLayout = ({ numBoxes }) => {
    return (
        <HorizontalGridLayout numBoxes={3}>
            <Box bg="tomato" height="200px">Component 1</Box>
            <Box bg="blue" height="200px">Component 2</Box>
            <Box bg="green" height="200px">Component 3</Box>
        </HorizontalGridLayout>
    );
};

export default HorizontalGridLayout; 