import React from 'react';
//import HorizontalGridLayout from '../HorizontalGridLayout';
import ShopCategory from '../ShopCategory';
import { Box, HStack } from '../shared/ui/index';

const ShopNowBar = () => {
    console.log('===========ShopNowBar===========\n');
    return (
        <Box>
        <Box  p={10} textAlign="center" fontWeight="bold" fontSize="2xl">
    Discover Amazing Deals! Shop Now and Save Big!
</Box>
        <HStack spacing={4} align="stretch">
        <Box flex={1}>
          <ShopCategory categoryId="womens-jewelry" />
        </Box>
        <Box flex={1}>
          <ShopCategory categoryId="newarrivals-womens" />
        </Box>
        <Box flex={1}>
          <ShopCategory categoryId="womens-accessories" />
        </Box>
      </HStack>
      </Box>      
       
    );
};

export default ShopNowBar; 