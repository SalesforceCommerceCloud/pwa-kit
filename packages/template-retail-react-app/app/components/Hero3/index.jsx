import React from 'react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

const Hero3 = () => {
    return (
        <Flex justify="space-between" align="center" bg="gray.100" p={5}>
            <Box flex="1" bgImage="url('https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd6a81388/images/large/PG.10236662.JJ3WCXX.PZ.jpg?sw=1360&q=60')" bgSize="cover" h="400px" position="relative">
            
                <Box position="absolute" top="50%" left="100%" transform="translate(0%, -50%)" textAlign="center" bg="rgba(0, 0, 0, 0.1)" p={4} borderRadius="md" w="100%">
                    <Heading color="white">NEW VIBES ONLY</Heading>
                    <Text color="white">EXPLORE NEW ARRIVALS</Text>
                    <Flex justify="center" mt={4}>
                        <Button m={2} fontSize="xs" bg="white" color="black">SHOP MEN'S</Button>
                        <Button m={2} fontSize="xs" bg="white" color="black">SHOP WOMEN'S</Button>
                        <Button m={2} fontSize="xs" bg="white" color="black">SHOP KIDS'</Button>
                    </Flex>
                </Box>
            </Box>
            <Box flex="1" bgImage="url('https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw429bae4a/images/large/PG.60108554.JJ887XX.PZ.jpg?sw=1360&q=60')"  bgSize="cover" h="400px" />
            <Box flex="1" bgImage="url('https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa5f7e41/images/large/PG.10236662.JJ3WCXX.BZ.jpg?sw=1360&q=60')" bgSize="cover" h="400px" />
        </Flex>
    );
};

export default Hero3; 