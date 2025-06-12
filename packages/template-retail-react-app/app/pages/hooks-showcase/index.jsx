import React, {useState} from 'react'
import {Box, Heading, Text, VStack, HStack, Divider, Button, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Code} from '@chakra-ui/react'
import {useLocation, useHistory} from 'react-router-dom'
import ShowcaseTopBar from '@salesforce/retail-react-app/app/components/shared/ShowcaseTopBar'

const hookGroups = [
    {
        name: 'ShopperProducts',
        description: 'Hooks for accessing product and category data from the Shopper Products API. Use these to fetch product details, categories, and related information for building product detail pages, category listings, and navigation.',
        hooks: [
            {
                name: 'useProduct',
                summary: 'Gets a product by ID from the Shopper Products API. Returns a TanStack Query hook with data from the getProduct endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProduct',
                options: [
                    {name: 'parameters', description: 'Object with product id (e.g., { id: "123" })'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useProducts',
                summary: 'Gets multiple products by IDs from the Shopper Products API. Returns a TanStack Query hook with data from the getProducts endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts',
                options: [
                    {name: 'parameters', description: 'Object with ids (e.g., { ids: ["123", "456"] })'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCategories',
                summary: 'Gets multiple categories by IDs from the Shopper Products API. Returns a TanStack Query hook with data from the getCategories endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategories',
                options: [
                    {name: 'parameters', description: 'Object with ids (e.g., { ids: ["cat1", "cat2"] })'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCategory',
                summary: 'Gets a category by ID from the Shopper Products API. Returns a TanStack Query hook with data from the getCategory endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getCategory',
                options: [
                    {name: 'parameters', description: 'Object with category id (e.g., { id: "cat1" })'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            }
        ]
    },
    {
        name: 'ShopperBaskets',
        description: 'Hooks for managing shopping baskets (carts). Use these to create, update, and retrieve baskets, add or remove items, manage coupons, and handle basket-related checkout flows.',
        hooks: [
            {
                name: 'useBasket',
                summary: 'Gets a basket by ID from the Shopper Baskets API. Returns a TanStack Query hook with data from the getBasket endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getBasket',
                options: [
                    {name: 'parameters', description: 'Object with basket id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'usePaymentMethodsForBasket',
                summary: 'Gets applicable payment methods for an existing basket. Returns a TanStack Query hook with data from the getPaymentMethodsForBasket endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPaymentMethodsForBasket',
                options: [
                    {name: 'parameters', description: 'Object with basket id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'usePriceBooksForBasket',
                summary: 'Gets applicable price books for an existing basket. Returns a TanStack Query hook with data from the getPriceBooksForBasket endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getPriceBooksForBasket',
                options: [
                    {name: 'parameters', description: 'Object with basket id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useShippingMethodsForShipment',
                summary: 'Gets the applicable shipping methods for a certain shipment of a basket. Returns a TanStack Query hook with data from the getShippingMethodsForShipment endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getShippingMethodsForShipment',
                options: [
                    {name: 'parameters', description: 'Object with basket id and shipment id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useTaxesFromBasket',
                summary: 'Gets external taxation data for a basket. Returns a TanStack Query hook with data from the getTaxesFromBasket endpoint.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=getTaxesFromBasket',
                options: [
                    {name: 'parameters', description: 'Object with basket id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useShopperBasketsMutation',
                summary: 'Perform mutations on baskets (create, update, delete, etc). This hook provides access to all mutation endpoints for baskets, such as createBasket, addItemToBasket, updateBasket, etc.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets',
                options: [
                    {name: 'mutation', description: 'Mutation type (e.g., CreateBasket, AddItemToBasket, etc)'},
                    {name: 'parameters', description: 'Mutation parameters object'}
                ]
            }
        ]
    },
    {
        name: 'ShopperCustomers',
        description: (
            <>
                Hooks for accessing and managing customer data, including customer profiles, addresses, payment instruments, and product lists. Useful for account management, wishlists, and order history features.<br/>
                See:{' '}
                <a href="https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers" target="_blank" rel="noopener noreferrer" style={{color: '#3182ce', textDecoration: 'underline'}}>
                    https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers
                </a>
            </>
        ),
        hooks: [
            {
                name: 'useCustomer',
                summary: 'Gets a customer by ID from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomer endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomer',
                options: [
                    {name: 'parameters', description: 'Object with customer id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCustomerAddress',
                summary: 'Retrieves a customer\'s address by address name from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomerAddress endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerAddress',
                options: [
                    {name: 'parameters', description: 'Object with customer id and address name'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCustomerBaskets',
                summary: 'Gets all baskets for a customer from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomerBaskets endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerBaskets',
                options: [
                    {name: 'parameters', description: 'Object with customer id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCustomerOrders',
                summary: 'Returns a pageable list of all customer\'s orders from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomerOrders endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerOrders',
                options: [
                    {name: 'parameters', description: 'Object with customer id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCustomerPaymentInstrument',
                summary: 'Fetches a customer payment instrument from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomerPaymentInstrument endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerPaymentInstrument',
                options: [
                    {name: 'parameters', description: 'Object with customer id and payment instrument id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCustomerProductLists',
                summary: 'Fetches all product lists for a customer from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomerProductLists endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductLists',
                options: [
                    {name: 'parameters', description: 'Object with customer id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCustomerProductList',
                summary: 'Fetches a single product list for a customer from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomerProductList endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductList',
                options: [
                    {name: 'parameters', description: 'Object with customer id and list id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useCustomerProductListItem',
                summary: 'Fetches a single product list item for a customer from the Shopper Customers API. Returns a TanStack Query hook with data from the getCustomerProductListItem endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductListItem',
                options: [
                    {name: 'parameters', description: 'Object with customer id, list id, and item id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'usePublicProductListsBySearchTerm',
                summary: 'Fetches public product lists by search term from the Shopper Customers API. Returns a TanStack Query hook with data from the getPublicProductListsBySearchTerm endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductListsBySearchTerm',
                options: [
                    {name: 'parameters', description: 'Object with search term'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'usePublicProductList',
                summary: 'Fetches a public product list by ID from the Shopper Customers API. Returns a TanStack Query hook with data from the getPublicProductList endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductList',
                options: [
                    {name: 'parameters', description: 'Object with list id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useProductListItem',
                summary: 'Fetches a product list item by ID from the Shopper Customers API. Returns a TanStack Query hook with data from the getProductListItem endpoint.' +
                    '\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getProductListItem',
                options: [
                    {name: 'parameters', description: 'Object with item id'},
                    {name: 'queryOptions', description: 'TanStack Query options'}
                ]
            },
            {
                name: 'useShopperCustomersMutation',
                summary: 'Perform mutations on customers (register, update, address, payment, product lists, etc). This hook provides access to all mutation endpoints for customers, such as registerCustomer, updateCustomer, createCustomerAddress, etc.\nSee: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers',
                options: [
                    {name: 'mutation', description: 'Mutation type (e.g., RegisterCustomer, UpdateCustomer, etc)'},
                    {name: 'parameters', description: 'Mutation parameters object'}
                ]
            }
        ]
    },
    {
        name: 'ShopperContexts',
        description: 'Hooks for retrieving and updating the shopper context, such as locale, currency, and other session-specific settings. Use these to personalize the shopping experience based on user preferences or geolocation.',
        hooks: [
            {name: 'useShopperContext', summary: 'Fetch the shopper context for the current shopper.', options: [
                {name: 'parameters', description: 'Object with context parameters'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'useShopperContextsMutation', summary: 'Perform mutations on shopper context (create, update, delete).', options: [
                {name: 'mutation', description: 'Mutation type (e.g., CreateShopperContext, UpdateShopperContext, DeleteShopperContext)'},
                {name: 'parameters', description: 'Mutation parameters object'}]}
        ]
    },
    {
        name: 'ShopperExperience',
        description: 'Hooks for accessing Page Designer pages and content experiences. Use these to fetch and render dynamic, personalized content and layouts authored in Page Designer.',
        hooks: [
            {name: 'usePages', summary: 'Fetch Page Designer pages for a product or category.', options: [
                {name: 'parameters', description: 'Object with aspectTypeId, categoryId, or productId'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'usePage', summary: 'Fetch a single Page Designer page by page ID.', options: [
                {name: 'parameters', description: 'Object with page id'},
                {name: 'queryOptions', description: 'TanStack Query options'}]}
        ]
    },
    {
        name: 'ShopperOrders',
        description: 'Hooks for retrieving and managing orders, payment methods, and order-related taxation. Use these for order history, order details, and post-checkout flows.',
        hooks: [
            {name: 'useOrder', summary: 'Fetch an order by ID.', options: [
                {name: 'parameters', description: 'Object with order id'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'usePaymentMethodsForOrder', summary: 'Fetch payment methods for an order.', options: [
                {name: 'parameters', description: 'Object with order id'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'useTaxesFromOrder', summary: 'Fetch external taxation data for an order.', options: [
                {name: 'parameters', description: 'Object with order id'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'useShopperOrdersMutation', summary: 'Perform mutations on orders (create, payment instrument, etc).', options: [
                {name: 'mutation', description: 'Mutation type (e.g., CreateOrder, CreatePaymentInstrumentForOrder, etc)'},
                {name: 'parameters', description: 'Mutation parameters object'}]}
        ]
    },
    {
        name: 'ShopperLogin',
        description: 'Hooks for handling shopper authentication, login, logout, and token management. Use these to implement secure login flows, password resets, and session management.',
        hooks: [
            {name: 'useUserInfo', summary: 'Fetch claims about the currently authenticated user.', options: [
                {name: 'parameters', description: 'Object with user info parameters'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'useWellknownOpenidConfiguration', summary: 'Fetch OpenID/OAuth endpoints, supported scopes, claims, and public keys.', options: [
                {name: 'parameters', description: 'Object with configuration parameters'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'useJwksUri', summary: 'Fetch the JSON Web Key Set (JWKS) for validating JWTs.', options: [
                {name: 'parameters', description: 'Object with JWKS parameters'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'useShopperLoginMutation', summary: 'Perform login-related mutations (authorize, logout, get tokens, reset password, etc).', options: [
                {name: 'mutation', description: 'Mutation type (e.g., AuthorizeCustomer, LogoutCustomer, GetAccessToken, etc)'},
                {name: 'parameters', description: 'Mutation parameters object'}]}
        ]
    },
    {
        name: 'ShopperPromotions',
        description: 'Hooks for retrieving active promotions and campaign-based offers. Use these to display promotional banners, discounts, and campaign-specific deals to shoppers.',
        hooks: [
            {name: 'usePromotions', summary: 'Fetch enabled promotions for a list of IDs.', options: [
                {name: 'parameters', description: 'Object with promotion ids'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'usePromotionsForCampaign', summary: 'Fetch enabled promotions for a campaign and optional date range.', options: [
                {name: 'parameters', description: 'Object with campaign_id, start_date, end_date'},
                {name: 'queryOptions', description: 'TanStack Query options'}]}
        ]
    },
    {
        name: 'ShopperSearch',
        description: 'Hooks for product search and search suggestions. Use these to power keyword search, refinement filters, and autocomplete suggestions in your storefront.',
        hooks: [
            {name: 'useProductSearch', summary: 'Keyword and refinement search for products.', options: [
                {name: 'parameters', description: 'Object with search parameters (keywords, refinements, etc)'},
                {name: 'queryOptions', description: 'TanStack Query options'}]},
            {name: 'useSearchSuggestions', summary: 'Get search suggestions for products, categories, and brands.', options: [
                {name: 'parameters', description: 'Object with search phrase'},
                {name: 'queryOptions', description: 'TanStack Query options'}]}
        ]
    }
]

// Utility to render summary with clickable links
function renderSummaryWithLinks(summary) {
    // Split summary into lines for 'See: ' links
    const seeRegex = /(See: (https?:\/\/[^\s]+))/g
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const lines = summary.split(seeRegex)
    const seenLinks = new Set()
    return lines.map((line, idx) => {
        if (seeRegex.test(line)) {
            // Extract the URL
            const urlMatch = line.match(urlRegex)
            if (urlMatch && !seenLinks.has(urlMatch[0])) {
                seenLinks.add(urlMatch[0])
                return (
                    <div key={idx} style={{marginTop: 4}}>
                        See:{' '}
                        <a href={urlMatch[0]} target="_blank" rel="noopener noreferrer" style={{color: '#3182ce', textDecoration: 'underline'}}>
                            {urlMatch[0]}
                        </a>
                    </div>
                )
            }
            // If duplicate, skip rendering
            return null
        }
        // For other lines, still render inline links if present, but only if not already rendered
        const parts = line.split(urlRegex)
        return parts.map((part, i) => {
            if (urlRegex.test(part)) {
                if (!seenLinks.has(part)) {
                    seenLinks.add(part)
                    return (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{color: '#3182ce', textDecoration: 'underline'}}>
                            {part}
                        </a>
                    )
                }
                // If duplicate, skip rendering
                return null
            }
            return part
        })
    })
}

const HooksShowcase = () => {
    const location = useLocation()
    const history = useHistory()
    const [selectedGroup, setSelectedGroup] = useState(hookGroups[0].name)
    const group = hookGroups.find((g) => g.name === selectedGroup)
    const goToPageShowcase = () => history.push('/page-showcase')
    const goToComponentShowcase = () => history.push('/component-showcase')
    const goToHooksShowcase = () => history.push('/hooks-showcase')

    return (
        <Box data-testid="hooks-showcase-page" layerStyle="page">
            <ShowcaseTopBar />
            {/* Main Content Layout */}
            <Flex maxWidth="container.2xl" mx="auto" minH="70vh" borderWidth={1} borderRadius="lg" overflow="hidden" bg="white" boxShadow="md">
                {/* Sidebar */}
                <Box w="260px" bg="gray.50" borderRightWidth={1} p={4}>
                    <VStack align="stretch" spacing={2}>
                        {hookGroups.map((g) => (
                            <Button
                                key={g.name}
                                variant={selectedGroup === g.name ? 'solid' : 'ghost'}
                                colorScheme={selectedGroup === g.name ? 'blue' : 'gray'}
                                onClick={() => setSelectedGroup(g.name)}
                                justifyContent="flex-start"
                            >
                                {g.name}
                            </Button>
                        ))}
                    </VStack>
                </Box>
                {/* Right Pane */}
                <Box flex={1} p={8} minW={0} maxW="800px" mx="auto">
                    <Heading as="h2" size="md" mb={4}>
                     {group.name} Hooks
                    </Heading>
                    <Box color="gray.600" mb={4}>{group.description}</Box>
                    <VStack align="stretch" spacing={6}>
                        {group.hooks.map((hook) => (
                            <Box key={hook.name} borderWidth={1} borderRadius="md" p={5} bg="gray.25">
                                <HStack justify="space-between" align="flex-start">
                                    <Box>
                                        <Heading as="h3" size="md" mb={1}>
                                            <Code fontSize="md">{hook.name}</Code>
                                        </Heading>
                                        <Text mb={2}>{renderSummaryWithLinks(hook.summary)}</Text>
                                        <Text fontWeight="semibold" mb={1}>Options:</Text>
                                        <VStack align="stretch" spacing={1}>
                                            {hook.options.map((opt) => (
                                                <Text key={opt.name} fontSize="sm">
                                                    <Code fontSize="sm" colorScheme="gray">{opt.name}</Code>: {opt.description}
                                                </Text>
                                            ))}
                                        </VStack>
                                    </Box>
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            </Flex>
        </Box>
    )
}

export default HooksShowcase 