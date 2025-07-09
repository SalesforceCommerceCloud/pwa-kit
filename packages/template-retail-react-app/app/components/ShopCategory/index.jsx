import React, { useEffect, useState } from 'react';
import { Box, Image, Text, Link, VStack } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { useCategory } from '@salesforce/commerce-sdk-react';

const useCategoryData = (categoryId) => {
    const { data: categoriesTree } = useCategory({
        parameters: { id: categoryId, levels: 0 }
    });
    console.log('===========categoriesTree===========\n', categoriesTree);

    return categoriesTree; // Return the category data
};



const ShopCategory = ({ categoryId = 'womens-clothing-tops' }) => {
    const categoryData = useCategoryData(categoryId);

    return (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" maxW="sm">
            <Image src={categoryData?.c_slotBannerImage || 'https://via.placeholder.com/400x300'} alt="Category Image" width="100%" />
            <VStack align="start" p={4} spacing={2}>
                <Text fontWeight="bold" fontSize="lg">{categoryData?.name || 'New Arrivals'}</Text>
                <Text>{
                    categoryData?.pageDescription?.length > 50
                        ? `${categoryData.pageDescription.substring(0, 47)}...`
                        : categoryData?.pageDescription || 'The moment has arrived.'
                }</Text>

                <Link href={`/category/${categoryData?.id || 'New Arrivals'}`} color="blue.500" fontWeight="bold">
                    SHOP NOW
                </Link>
            </VStack>
        </Box>
    );
};

ShopCategory.propTypes = {
    categoryId: PropTypes.string.isRequired
};

export default ShopCategory; 