import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage} from 'react-intl'
import {useLocation} from 'react-router-dom'

// Components
import {
    Box,
    Button,
    SimpleGrid,
    HStack,
    VStack,
    Text,
    Flex,
    Stack,
    Container,
    Link,
} from '@chakra-ui/react'

// Project Components
import Hero from '^retail-react-app/app/components/hero'
import Seo from '^retail-react-app/app/components/seo'
import Section from '^retail-react-app/app/components/section'
import ProductScroller from '^retail-react-app/app/components/product-scroller'

// Others
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'

console.log('~TODO: override pages/home/data below !!! (uses useIntl())')
import {heroFeatures, features} from '^retail-react-app/app/pages/home/data'

// TODO: remove me!
import {ChakraProvider} from '@chakra-ui/react'
import theme from '^retail-react-app/app/theme'

//Hooks
import useEinstein from '^retail-react-app/app/commerce-api/hooks/useEinstein'

// Constants
import {
    MAX_CACHE_AGE,
    HOME_SHOP_PRODUCTS_CATEGORY_ID,
    HOME_SHOP_PRODUCTS_LIMIT,
} from '^retail-react-app/app/constants'

const Home = ({productSearchResult, isLoading}) => {
    const intl = useIntl()
    if (isLoading) {
        return (
            <Box
                key={'temp'}
                background={'white'}
                boxShadow={'0px 2px 2px rgba(0, 0, 0, 0.1)'}
                borderRadius={'4px'}
            >
                <Box data-testid="home-page" layerStyle="page">
                    <div>This is my new home</div>
                    <span>Total products: {productSearchResult?.hits?.length}</span>
                    <ul>
                        {productSearchResult?.hits?.map((item) => (
                            <li>
                                {item?.productName}
                                <br />
                                {JSON.stringify(item)}
                                <img src={item?.image?.disBaseLink} />
                            </li>
                        ))}
                    </ul>
                </Box>
            </Box>
        )
    }
    useEffect(() => {
        console.log('~74 theme', theme)
    })

    return (
        <ChakraProvider theme={theme}>
            <Box data-testid="home-page" layerStyle="page">
                <Seo
                    title="Home Page"
                    description="Commerce Cloud Retail React App"
                    keywords="Commerce Cloud, Retail React App, React Storefront"
                />

                <Hero
                    // @TODO: translations not working?
                    title={'🎉 Hello Extensible React Template!'}
                    img={{
                        src: getAssetUrl('static/img/hero.png'),
                        alt: 'npx pwa-kit-create-app',
                    }}
                    actions={
                        <Stack spacing={{base: 4, sm: 6}} direction={{base: 'column', sm: 'row'}}>
                            <Button
                                as={Link}
                                href="https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html"
                                target="_blank"
                                width={{base: 'full', md: 'inherit'}}
                                paddingX={7}
                                _hover={{textDecoration: 'none'}}
                            >
                                <FormattedMessage
                                    defaultMessage="Get started"
                                    id="home.link.get_started"
                                />
                            </Button>
                        </Stack>
                    }
                />

                <Section
                    background={'gray.50'}
                    marginX="auto"
                    paddingY={{base: 8, md: 16}}
                    paddingX={{base: 4, md: 8}}
                    borderRadius="base"
                    width={{base: '100vw', md: 'inherit'}}
                    position={{base: 'relative', md: 'inherit'}}
                    left={{base: '50%', md: 'inherit'}}
                    right={{base: '50%', md: 'inherit'}}
                    marginLeft={{base: '-50vw', md: 'auto'}}
                    marginRight={{base: '-50vw', md: 'auto'}}
                >
                    <SimpleGrid
                        columns={{base: 1, md: 1, lg: 3}}
                        spacingX={{base: 1, md: 4}}
                        spacingY={{base: 4, md: 14}}
                    >
                        {heroFeatures.map((feature, index) => {
                            const featureMessage = feature.message
                            return (
                                <Box
                                    key={index}
                                    background={'white'}
                                    boxShadow={'0px 2px 2px rgba(0, 0, 0, 0.1)'}
                                    borderRadius={'4px'}
                                >
                                    <Link target="_blank" href={feature.href}>
                                        <HStack>
                                            <Flex
                                                paddingLeft={6}
                                                height={24}
                                                align={'center'}
                                                justify={'center'}
                                            >
                                                {feature.icon}
                                            </Flex>
                                            <Text fontWeight="700">
                                                {intl.formatMessage(featureMessage.title)}
                                            </Text>
                                        </HStack>
                                    </Link>
                                </Box>
                            )
                        })}
                    </SimpleGrid>
                </Section>

                {productSearchResult && (
                    <Section
                        padding={4}
                        paddingTop={16}
                        title={intl.formatMessage({
                            defaultMessage: 'Shop Products',
                            id: 'home.heading.shop_products',
                        })}
                        subtitle={intl.formatMessage(
                            {
                                defaultMessage:
                                    'This section contains content from the catalog. {docLink} on how to replace it.',
                                id: 'home.description.shop_products',
                                description:
                                    '{docLink} is a html button that links the user to https://sfdc.co/business-manager-manage-catalogs',
                            },
                            {
                                docLink: (
                                    <Link
                                        target="_blank"
                                        href={'https://sfdc.co/business-manager-manage-catalogs'}
                                        textDecoration={'none'}
                                        position={'relative'}
                                        _after={{
                                            position: 'absolute',
                                            content: `""`,
                                            height: '2px',
                                            bottom: '-2px',
                                            margin: '0 auto',
                                            left: 0,
                                            right: 0,
                                            background: 'gray.700',
                                        }}
                                        _hover={{textDecoration: 'none'}}
                                    >
                                        {intl.formatMessage({
                                            defaultMessage: 'Read docs',
                                            id: 'home.link.read_docs',
                                        })}
                                    </Link>
                                ),
                            }
                        )}
                    >
                        <Stack pt={8} spacing={16}>
                            <ProductScroller
                                products={productSearchResult?.hits}
                                isLoading={isLoading}
                            />
                        </Stack>
                    </Section>
                )}

                <Section
                    padding={4}
                    paddingTop={32}
                    title="Features"
                    title={intl.formatMessage({
                        defaultMessage: 'Features',
                        id: 'home.heading.features',
                    })}
                    subtitle={
                        'Out-of-the-box features so that you focus only on adding enhancements.'
                    }
                    subtitle={intl.formatMessage({
                        defaultMessage:
                            'Out-of-the-box features so that you focus only on adding enhancements.',
                        id: 'home.description.features',
                    })}
                >
                    <Container maxW={'6xl'} marginTop={10}>
                        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={10}>
                            {features.map((feature, index) => {
                                const featureMessage = feature.message
                                return (
                                    <HStack key={index} align={'top'}>
                                        <VStack align={'start'}>
                                            <Flex
                                                width={16}
                                                height={16}
                                                align={'center'}
                                                justify={'left'}
                                                color={'gray.900'}
                                                paddingX={2}
                                            >
                                                {feature.icon}
                                            </Flex>
                                            <Text color={'black'} fontWeight={700} fontSize={20}>
                                                {intl.formatMessage(featureMessage.title)}
                                            </Text>
                                            <Text color={'black'}>
                                                {intl.formatMessage(featureMessage.text)}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                )
                            })}
                        </SimpleGrid>
                    </Container>
                </Section>

                <Section
                    padding={4}
                    paddingTop={32}
                    title={intl.formatMessage({
                        defaultMessage: "We're here to help",
                        id: 'home.heading.here_to_help',
                    })}
                    subtitle={
                        <>
                            <>
                                {intl.formatMessage({
                                    defaultMessage: 'Contact our support staff.',
                                    id: 'home.description.here_to_help',
                                })}
                            </>
                            <br />
                            <>
                                {intl.formatMessage({
                                    defaultMessage: 'They will get you to the right place.',
                                    id: 'home.description.here_to_help_line_2',
                                })}
                            </>
                        </>
                    }
                    actions={
                        <Button
                            as={Link}
                            href="https://help.salesforce.com/s/?language=en_US"
                            target="_blank"
                            width={'auto'}
                            paddingX={7}
                            _hover={{textDecoration: 'none'}}
                        >
                            <FormattedMessage
                                defaultMessage="Contact Us"
                                id="home.link.contact_us"
                            />
                            Contact Us
                        </Button>
                    }
                    maxWidth={'xl'}
                />
            </Box>
        </ChakraProvider>
    )
}

Home.getTemplateName = () => 'home'

Home.shouldGetProps = ({previousLocation, location}) =>
    !previousLocation || previousLocation.pathname !== location.pathname

Home.getProps = async ({res, api}) => {
    if (res) {
        res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
    }

    const productSearchResult = await api.shopperSearch.productSearch({
        parameters: {
            refine: [`cgid=${HOME_SHOP_PRODUCTS_CATEGORY_ID}`, 'htype=master'],
            limit: HOME_SHOP_PRODUCTS_LIMIT,
        },
    })

    return {productSearchResult}
}

Home.propTypes = {
    /**
     * The search result object showing all the product hits, that belong
     * in the supplied category.
     */
    productSearchResult: PropTypes.object,
    /**
     * The current state of `getProps` when running this value is `true`, otherwise it's
     * `false`. (Provided internally)
     */
    isLoading: PropTypes.bool,
}

export default Home
