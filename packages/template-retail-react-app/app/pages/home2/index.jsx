import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import Hero2 from '@salesforce/retail-react-app/app/components/Hero2/index';
import Hero3 from '@salesforce/retail-react-app/app/components/Hero3/index';
import ShopNowBar from '@salesforce/retail-react-app/app/components/ShopNowBar';
import ProductScroller from '@salesforce/retail-react-app/app/components/product-scroller';
import { useProductSearch } from '@salesforce/commerce-sdk-react';
import Carousel2 from '@salesforce/retail-react-app/app/components/Carousel2';


const Home2 = () => {
    const {data: productSearchResult, isLoading} = useProductSearch({
        parameters: {
            refine: [`cgid=mens-clothing`, 'htype=master'],
            expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
            perPricebook: true,
            allVariationProperties: true,
            limit: 25
        }
    })
    
    return (
        <Box p={5}>
             <Carousel2  items={[
                    { text: 'Floral Shirt Dress', image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw883b3b59/images/large/PG.10249590.JJ2RRXX.PZ.jpg?sw=1360&q=60' },
                    { text: 'Taylor Classic Jacket', image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa090742f/images/large/PG.10232148.JJC76A6.PZ.jpg?sw=1360&q=60' },
                    { text: 'Dream Heels', image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5777f7f6/images/large/PG.CJZACCO.BLKBKPA.PZ.jpg?sw=1360&q=60' }
                ]} p={10}/>
            <Heading as="h1" size="3xl" m={10}>Welcome to Home2</Heading>
            <Text fontSize="lg">This is the new Home2 page.</Text>
            <Hero2 />
            <ShopNowBar />
           
            <Text fontSize="2xl" fontWeight="bold" m={20}>Great deals on mens clothing for Father's Day!</Text>

            <ProductScroller
                products={productSearchResult?.hits}
                isLoading={isLoading}
            />
               
        </Box>
    );
};

export default Home2; 