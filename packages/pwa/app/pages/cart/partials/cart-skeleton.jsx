import React from 'react'
import {
    Flex,
    Stack,
    Grid,
    GridItem,
    Container,
    Skeleton,
    SkeletonText,
    Text,
    Heading
} from '@chakra-ui/react'
import {FormattedMessage} from 'react-intl'

const CartSkeleton = () => {
    return (
        <Container
            data-testid="sf-cart-skeleton"
            maxWidth="container.xl"
            py={{base: 4, md: 8}}
            px={{base: 4, md: 8}}
        >
            <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                <GridItem>
                    <Stack spacing={6}>
                        <Text fontWeight="bold" fontSize={['xl', '2xl']}>
                            <FormattedMessage defaultMessage="Cart" />
                        </Text>
                        <Stack
                            spacing={4}
                            align="flex-start"
                            backgroundColor="white"
                            padding={[4, 6]}
                        >
                            <Flex width="full" backgroundColor="white" marginBottom={[4, 3]}>
                                <Skeleton
                                    marginBottom="62px"
                                    width={['88px', '136px']}
                                    height={['88px', '136px']}
                                    backgroundColor="gray.100"
                                    marginRight={4}
                                ></Skeleton>
                            </Flex>
                        </Stack>
                    </Stack>
                </GridItem>
                <GridItem py={6} px={[4, 4, 0]}>
                    <Stack spacing={5}>
                        <Heading fontSize="lg" lineHeight="30px">
                            <FormattedMessage defaultMessage="Order Summary" />
                        </Heading>
                        <Stack spacing={5} align="flex-start">
                            <Stack
                                width="full"
                                py={4}
                                borderY="1px"
                                borderColor="gray.200"
                                borderBottom="none"
                            >
                                <SkeletonText width="50%" mt="4" spacing="4" />
                            </Stack>
                            <SkeletonText width="50%" mt="4" spacing="4" />
                            <Skeleton w="95%" mb={4} variant="solid" />
                            <Skeleton m="auto" w="140px" justify="space-between" />
                        </Stack>
                    </Stack>
                </GridItem>
            </Grid>
        </Container>
    )
}

export default CartSkeleton
