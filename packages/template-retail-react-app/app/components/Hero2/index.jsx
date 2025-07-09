import React from 'react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

const Hero2 = () => {
    return (
        <Box bg="gray.100" position="relative">
        <Flex justify="space-between" align="center" bg="gray.100" p={2}>
            <Box flex="1" bgImage="url('https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd6a81388/images/large/PG.10236662.JJ3WCXX.PZ.jpg?sw=1360&q=60')" bgSize="cover" h="400px" />
            <Box flex="1" bgImage="url('https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw429bae4a/images/large/PG.60108554.JJ887XX.PZ.jpg?sw=1360&q=60')"  bgSize="cover" h="400px" />
            <Box flex="1" bgImage="url('https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa5f7e41/images/large/PG.10236662.JJ3WCXX.BZ.jpg?sw=1360&q=60')" bgSize="cover" h="400px" />
            <Box position="absolute" top="55%" left="1%"  textAlign="center" bg="rgba(0, 0, 0, 0.06)" p={0}  w="98%">
                    <Heading color="white">NEW VIBES ONLY</Heading>
                    <Text color="white">EXPLORE NEW ARRIVALS</Text>
                    <Flex justify="center" mt={4}>
                        <Button m={3} fontSize="xs" bg="white" color="black">WOMEN'S TOP</Button>
                        <Button m={3} fontSize="xs" bg="white" color="black">ACCESSORIES</Button>
                        <Button m={3} fontSize="xs" bg="white" color="black">SHOES</Button>

                    </Flex>
                </Box>
        </Flex>
        </Box>
    );
};

export default Hero2; 