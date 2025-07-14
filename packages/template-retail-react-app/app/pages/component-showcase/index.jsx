/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage} from 'react-intl'
import {useLocation, useHistory} from 'react-router-dom'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {
    Box,
    Button,
    Container,
    Heading,
    HStack,
    Input,
    SimpleGrid,
    Text,
    VStack,
    Badge,
    Skeleton,
    Spinner,
    Checkbox,
    Radio,
    RadioGroup,
    Select,
    Divider,
    Flex,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Seo from '@salesforce/retail-react-app/app/components/seo'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import mockProductDetail from '../../mocks/master-25517823M.js'
import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'
import ProductTile2 from '@salesforce/retail-react-app/app/components/product-tile2'
import ProductScroller from '@salesforce/retail-react-app/app/components/product-scroller'
import ActionCard from '@salesforce/retail-react-app/app/components/action-card'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import Footer from '@salesforce/retail-react-app/app/components/footer'
import OfflineBanner from '@salesforce/retail-react-app/app/components/offline-banner'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import PromoPopover from '@salesforce/retail-react-app/app/components/promo-popover'
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import Header from '@salesforce/retail-react-app/app/components/header'
import BasicTile from '@salesforce/retail-react-app/app/components/basic-tile'
import {DrawerMenu} from '@salesforce/retail-react-app/app/components/drawer-menu/drawer-menu'
import {RadioCard, RadioCardGroup} from '@salesforce/retail-react-app/app/components/radio-card'
import Pagination from '@salesforce/retail-react-app/app/components/pagination'
import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import ItemName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import ItemImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import ItemAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import ImageGallery from '@salesforce/retail-react-app/app/components/image-gallery'
import {cartVariant} from '@salesforce/retail-react-app/app/components/item-variant/data.mock'
import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'
import PageActionPlaceHolder from '@salesforce/retail-react-app/app/components/page-action-placeholder'
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal'
import {PlusIcon} from '@salesforce/retail-react-app/app/components/icons'
import ShowcaseTopBar from '@salesforce/retail-react-app/app/components/shared/ShowcaseTopBar'
import Hero from '@salesforce/retail-react-app/app/components/hero'
import Hero2 from '@salesforce/retail-react-app/app/components/Hero3/index.jsx';
import Hero3 from '@salesforce/retail-react-app/app/components/Hero2/index.jsx';
import ShopCategory from '@salesforce/retail-react-app/app/components/ShopCategory';
import ShopNowBar from '@salesforce/retail-react-app/app/components/ShopNowBar';
import Carousel from '@salesforce/retail-react-app/app/page-designer/layouts/Carousel';
import Carousel2 from '@salesforce/retail-react-app/app/components/Carousel2';

const mockProducts = [
    {
        id: '25752981M',
        productId: '25752981M',
        productName: 'Product 1',
        imageGroups: [
            {
                viewType: 'large',
                images: [
                    { disBaseLink: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_002/on/demandware.static/-/Sites-apparel-m-catalog/default/dw860db021/images/large/PG.949034314S.TAUPESI.PZ.jpg?sw=1076&q=60' }
                ]
            }
        ],
        price: 10.99,
        currency: 'USD'
    },
    {
        id: '25752982M',
        productId: '25752982M',
        productName: 'Product 2',
        image: { disBaseLink: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_002/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa07632e1/images/large/PG.10228317.JJEA7A0.PZ.jpg?sw=1076&q=60' },
        price: 12.99,
        currency: 'USD'
    },
    {
        id: '25752983M',
        productId: '25752983M',
        productName: 'Product 3',
        image: { disBaseLink: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_002/on/demandware.static/-/Sites-apparel-m-catalog/default/dw52d5b205/images/large/PG.10234352.JJ169XX.PZ.jpg?sw=1076&q=60' },
        price: 14.99,
        currency: 'USD'
    },
    {
        id: '25752984M',
        productId: '25752984M',
        productName: 'Product 4',
        image: { disBaseLink: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_002/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf0e43a96/images/large/PG.10227989.JJ9TSA0.PZ.jpg?sw=1076&q=60' },
        price: 16.99,
        currency: 'USD'
    },
    {
        id: '25752984M',
        productId: '25752984M',
        productName: 'Product 5',
        image: { disBaseLink: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_002/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2d85abbf/images/large/PG.10240098.JJ3WCXX.PZ.jpg?sw=1076&q=60' },
        price: 16.99,
        currency: 'USD'
    },
    {
        id: '25752984M',
        productId: '25752984M',
        productName: 'Product 6',
        image: { disBaseLink: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_002/on/demandware.static/-/Sites-apparel-m-catalog/default/dw38f2e3bd/images/large/PG.10228705.JJGN9A0.PZ.jpg?sw=1076&q=60' },
        price: 16.99,
        currency: 'USD'
    }
]

const demoAddress = {
    firstName: 'Jane',
    lastName: 'Doe',
    address1: '456 Market St',
    city: 'San Francisco',
    stateCode: 'CA',
    postalCode: '94111',
    countryCode: 'US'
}

const demoBasket = {
    basketId: 'demo-basket',
    currency: 'USD',
    productSubTotal: 49.98,
    shippingTotal: 5.0,
    taxTotal: 4.0,
    orderTotal: 58.98,
    productItems: [
        {
            productId: '25752981M',
            quantity: 1,
            price: 24.99,
            itemText: 'Product 1',
            image: {disBaseLink: 'https://via.placeholder.com/80x80?text=Product+1'}
        },
        {
            productId: '25752982M',
            quantity: 1,
            price: 24.99,
            itemText: 'Product 2',
            image: {disBaseLink: 'https://via.placeholder.com/80x80?text=Product+2'}
        }
    ],
    orderPriceAdjustments: [
        {
            priceAdjustmentId: 'promo1',
            itemText: 'Spring Sale',
            price: -5.0
        }
    ],
    shippingItems: [
        {
            priceAdjustments: []
        }
    ],
    couponItems: [
        {
            couponItemId: 'coupon1',
            code: 'SPRING2024'
        }
    ]
}

function ProductTile2Demo() {
    const [isFavorite, setIsFavorite] = useState(false)
    const [isAddingToCart, setIsAddingToCart] = useState(false)
    const toast = useToast()

    const handleAddToCart = (product) => {
        setIsAddingToCart(true)
        // Simulate API call
        setTimeout(() => {
            setIsAddingToCart(false)
            toast({
                title: `Added ${product.productName} to Cart`,
                description: product.variants?.[0]?.variationValues?.color 
                    ? `Selected color: ${product.variants[0].variationValues.color}`
                    : undefined,
                status: 'success',
                duration: 3000,
                isClosable: true
            })
        }, 1000)
    }

    return (
        <Box maxW="300px">
            <ProductTile2 
                product={mockProductDetail}
                enableFavourite={true}
                isFavourite={isFavorite}
                onFavouriteToggle={(newValue) => setIsFavorite(newValue)}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
            />
        </Box>
    )
}

const componentCategories = [
    {
        name: 'Button',
        description: 'Various button styles and states',
        component: (
            <VStack spacing={4} align="start">
                <HStack spacing={4}>
                    <Button colorScheme="blue">Primary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                </HStack>
                <HStack spacing={4}>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                </HStack>
            </VStack>
        )
    },
    {
        name: 'Product View',
        description: 'Full product detail view with images, price, variants, and actions.',
        component: (
            <Box maxW="900px">
                <ProductView 
                    product={mockProductDetail}
                    addToCart={() => {}}
                    addToWishlist={() => {}}
                />
            </Box>
        )
    },
    {
        name: 'Product Tile',
        description: 'A compact product card with image, name, price, and favorite icon.',
        component: (
            <Box maxW="300px">
                <ProductTile 
                    product={mockProductDetail}
                    enableFavourite={true}
                    isFavourite={false}
                />
            </Box>
        )
    },
    {
        name: 'Product Scroller',
        description: 'A horizontally scrollable row of product tiles.',
        component: (
            <Box maxW="900px">
                <ProductScroller title="Featured Products" products={mockProducts} />
            </Box>
        )
    },
    {
        name: 'Action Card',
        description: 'A card with optional edit and remove actions, used for lists or settings.',
        component: (
            <Box maxW="400px">
                <ActionCard
                    onEdit={() => alert('Edit clicked!')}
                    onRemove={() => new Promise(resolve => { setTimeout(resolve, 1000); alert('Removed!') })}
                >
                    <Box>
                        <strong>Shipping Address</strong>
                        <div>John Doe</div>
                        <div>123 Main St</div>
                        <div>San Francisco, CA 94105</div>
                    </Box>
                </ActionCard>
            </Box>
        )
    },
    {
        name: 'Address Display',
        description: 'Displays a formatted address block.',
        component: (
            <Box maxW="400px">
                <AddressDisplay address={demoAddress} />
            </Box>
        )
    },
    {
        name: 'Footer',
        description: 'The site-wide footer with links, locale selector, and legal info.',
        component: (
            <Footer />
        )
    },
    {
        name: 'Offline Banner',
        description: 'A banner that appears when the app is offline.',
        component: (
            <OfflineBanner />
        )
    },
    {
        name: 'Order Summary',
        description: 'A summary of the current order, including items, totals, and promotions.',
        component: (
            <Box maxW="500px">
                <OrderSummary basket={demoBasket} showCartItems={true} />
            </Box>
        )
    },
    {
        name: 'Toggle Card',
        description: 'A card that toggles between summary and edit states.',
        component: (
            <Box maxW="500px">
                <ToggleCard
                    id="demo-toggle-card"
                    title="Demo Toggle Card"
                    editing={false}
                    onEdit={() => alert('Edit clicked!')}
                >
                    <ToggleCardSummary>
                        <Text>This is the summary view. Click Edit to switch to edit mode.</Text>
                    </ToggleCardSummary>
                    <ToggleCardEdit>
                        <Text>This is the edit view. (Set editing=true to see this.)</Text>
                    </ToggleCardEdit>
                </ToggleCard>
            </Box>
        )
    },
    {
        name: 'Promo Popover',
        description: 'An info icon that shows a popover with promotional or informational content.',
        component: (
            <Box>
                <Text>
                    Hover over the info icon:
                    <PromoPopover header="Special Promotion!">
                        <Text>Get 20% off your next purchase. Use code <strong>PROMO20</strong> at checkout!</Text>
                    </PromoPopover>
                </Text>
            </Box>
        )
    },
    {
        name: 'Recommended Products',
        description: 'A product scroller showing recommended products.',
        component: (
            <Box maxW="900px">
                <RecommendedProducts
                    title={
                        <FormattedMessage
                            defaultMessage="Top Sellers"
                            id="empty_search_results.recommended_products.title.top_sellers"
                        />
                    }
                    recommender={'products-in-all-categories'}
                    mx={{base: -4, md: -8, lg: 0}}
                />
            </Box>
        )
    },
    {
        name: 'Header',
        description: 'The site-wide header with navigation, search, and user actions.',
        component: (
            <Box maxW="100vw">
                <Header />
            </Box>
        )
    },
    {
        name: 'Basic Tile',
        description: 'A simple tile with an image and a title.',
        component: (
            <Box maxW="200px">
                <BasicTile
                    img={{
                        src: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_002/on/demandware.static/-/Sites-apparel-m-catalog/default/dw33965793/images/large/PG.10237222.JJB52A0.PZ.jpg?sw=1360&q=60',
                        alt: 'Demo Category'
                    }}
                    href="/category/demo"
                    title="Demo Category"
                />
            </Box>
        )
    },
    {
        name: 'Drawer Menu',
        description: 'A mobile navigation drawer with nested accordions and actions.',
        component: <DrawerMenuDemo />
    },
    {
        name: 'Radio Card',
        description: 'A group of selectable cards styled as radio buttons.',
        component: (
            <RadioCardGroup name="demo-radio-card" defaultValue="option1">
                <RadioCard value="option1">Option 1</RadioCard>
                <RadioCard value="option2">Option 2</RadioCard>
                <RadioCard value="option3">Option 3</RadioCard>
            </RadioCardGroup>
        )
    },
    {
        name: 'Pagination',
        description: 'A pagination component with previous/next buttons and page selection.',
        component: (
            <Pagination
                urls={["/page/1", "/page/2", "/page/3", "/page/4"]}
                currentURL="/page/2"
            />
        )
    },
    {
        name: 'Breadcrumb',
        description: "A navigation aid showing the current page's location within a hierarchy.",
        component: (
            <Breadcrumb
                categories={[
                    {id: 'home', name: 'Home'},
                    {id: 'category', name: 'Category'},
                    {id: 'subcategory', name: 'Subcategory'},
                    {id: 'product', name: 'Product'}
                ]}
            />
        )
    },
    {
        name: 'Confirmation Modal',
        description: 'A modal dialog for confirming user actions.',
        component: <ConfirmationModalDemo />
    },
    {
        name: 'Item Variant',
        description: 'Displays product variant details using context.',
        component: (
            <ItemVariantProvider variant={cartVariant}>
                <Box display="flex" alignItems="center" gap={4}>
                    <ItemImage />
                    <Box>
                        <ItemName />
                        <ItemAttributes includeQuantity />
                    </Box>
                </Box>
            </ItemVariantProvider>
        )
    },
    {
        name: 'Image Gallery',
        description: 'A gallery for product images with thumbnails and hero image.',
        component: (
            <Box maxW="400px">
                <ImageGallery imageGroups={cartVariant.imageGroups} />
            </Box>
        )
    },
    {
        name: 'Swatch Group',
        description: 'A group of selectable swatches, e.g. for color or size.',
        component: <SwatchGroupDemo />
    },
    {
        name: 'Quantity Picker',
        description: 'A numeric input for selecting product quantity.',
        component: <QuantityPicker productName="Demo Product" defaultValue={1} min={1} max={10} />
    },
    {
        name: 'Page Action Place Holder',
        description: 'A placeholder for page actions, often used for empty states or CTAs.',
        component: (
            <PageActionPlaceHolder
                heading="No Items Yet"
                text="You have not added any items. Start by adding a new one."
                buttonText="Add Item"
                onButtonClick={() => alert('Add Item Clicked!')}
                icon={<PlusIcon boxSize={8} />}
            />
        )
    },
    {
        name: 'Product View Modal',
        description: 'A modal dialog that displays product details.',
        component: <ProductViewModalDemo />
    },
    {
        name: 'Hero',
        description: 'A prominent hero section with image, title, and actions.',
        component: (
            <Hero
                title="The React PWA Starter Store for Retail"
                img={{
                    src: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg',
                    alt: 'PWA Kit Hero'
                }}
                actions={null}
            />
        )
    },
    {
        name: 'Hero2',
        description: 'A hero section with images, title, and buttons.',
        component: (
            <Hero2 />
        )
    },
    {
        name: 'Hero3',
        description: 'A hero section with multiple images and overlay text.',
        component: (
            <Hero3 />
        )
    },
    {
        name: 'ShopCategory',
        description: 'A component with an image, text, and link.',
        component: (
            <ShopCategory categoryId="newarrivals-womens" />
        )
    },
    {
        name: 'ShopNowBar',
        description: 'A bar with multiple ShopCategory components.',
        component: (
            <ShopNowBar />
        )
    },
    {
        name: 'Carousel',
        description: 'A carousel component for showcasing items.',
        component: (
            <Carousel
                textHeadline="Featured Products"
                xsCarouselIndicators={true}
                smCarouselIndicators={true}
                mdCarouselIndicators={true}
                xsCarouselControls={true}
                smCarouselControls={true}
                xsCarouselSlidesToDisplay={1}
                smCarouselSlidesToDisplay={2}
                mdCarouselSlidesToDisplay={3}
                regions={[{ components: mockProducts.map(product => (
                    <ProductTile
                        key={product.id}
                        product={product}
                        enableFavourite={true}
                        isFavourite={false}
                    />
                )) }]}
            />
        )
    },
    {
        name: 'Carousel2',
        description: 'A carousel component displaying text and image pairs.',
        component: (
            <Carousel2
                items={[
                    { text: 'Floral Shirt Dress', image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw883b3b59/images/large/PG.10249590.JJ2RRXX.PZ.jpg?sw=1360&q=60' },
                    { text: 'Taylor Classic Jacket', image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa090742f/images/large/PG.10232148.JJC76A6.PZ.jpg?sw=1360&q=60' },
                    { text: 'Dream Heels', image: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5777f7f6/images/large/PG.CJZACCO.BLKBKPA.PZ.jpg?sw=1360&q=60' }
                ]}
            />
        )
    },
    {
        name: 'Product Tile 2',
        description: 'A clone of the original ProductTile component.',
        component: <ProductTile2Demo />
    },
].sort((a, b) => a.name.localeCompare(b.name))

function DrawerMenuDemo() {
    const [isOpen, setIsOpen] = React.useState(false)
    const root = {
        // ... existing code ...
    }
}

function ConfirmationModalDemo() {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
        <Box>
            <Button colorScheme="red" onClick={() => setIsOpen(true)}>
                Open Confirmation Modal
            </Button>
            <ConfirmationModal
                isOpen={isOpen}
                onOpen={() => setIsOpen(true)}
                onClose={() => setIsOpen(false)}
                dialogTitle="Delete Item"
                confirmationMessage="Are you sure you want to delete this item?"
                primaryActionLabel="Delete"
                primaryActionAriaLabel="Delete item"
                alternateActionLabel="Cancel"
                alternateActionAriaLabel="Cancel deletion"
                onPrimaryAction={() => alert('Deleted!')}
                onAlternateAction={() => {}}
            />
        </Box>
    )
}

function SwatchGroupDemo() {
    const [selected, setSelected] = React.useState('red')
    return (
        <SwatchGroup label="Color" value={selected} handleChange={setSelected} displayName={selected}>
            <Swatch value="red" label="Red" name="Red" />
            <Swatch value="blue" label="Blue" name="Blue" />
            <Swatch value="green" label="Green" name="Green" />
        </SwatchGroup>
    )
}

function ProductViewModalDemo() {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
        <Box>
            <Button colorScheme="blue" onClick={() => setIsOpen(true)}>
                Open Product View Modal
            </Button>
            <ProductViewModal
                isOpen={isOpen}
                onOpen={() => setIsOpen(true)}
                onClose={() => setIsOpen(false)}
                product={mockProductDetail}
            />
        </Box>
    )
}

const ComponentShowcase = ({componentList = []}) => {
    const intl = useIntl()
    const location = useLocation()
    const history = useHistory()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const {isOpen, onOpen, onClose} = useDisclosure()

    // Support ?component=Component%20Name query param
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const componentName = params.get('component')
        if (componentName) {
            const idx = componentCategories.findIndex(
                (comp) => comp.name.toLowerCase() === componentName.toLowerCase()
            )
            if (idx !== -1) setSelectedIndex(idx)
        }
    }, [location.search])

    // Filtered list for search
    const filteredComponents = searchTerm
        ? componentCategories.filter(comp =>
            comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : componentCategories

    // If the selected index is out of bounds after filtering, reset to 0
    const safeSelectedIndex =
        selectedIndex >= filteredComponents.length ? 0 : selectedIndex
    const selectedComponent = filteredComponents[safeSelectedIndex]

    const goToPageShowcase = () => history.push('/_dev/page-showcase')
    const goToComponentShowcase = () => history.push('/_dev/component-showcase')
    const goToHooksShowcase = () => history.push('/_dev/hooks-showcase')


    return (
        <Box data-testid="component-showcase-page" layerStyle="page">
            <ShowcaseTopBar />
            <Container maxW="container.2xl" py={8}>
                <Heading as="h1" size="2xl" color="blue.600" mb={8}>
                    Component Showcase
                </Heading>
                <Flex direction={{base: 'column', md: 'row'}} gap={8} align="flex-start">
                    {/* Sidebar */}
                    <Box
                        minW={{base: '100%', md: '260px'}}
                        maxW={{base: '100%', md: '260px'}}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={4}
                        shadow="sm"
                    >
                        <Button
                            onClick={onOpen}
                            mb={4}
                            w="full"
                            colorScheme="blue"
                        >
                            Browse Component
                        </Button>
                        <Input
                            mb={4}
                            placeholder="Search components..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value)
                                setSelectedIndex(0)
                            }}
                        />
                        <VStack align="stretch" spacing={1} style={{maxHeight: '60vh', overflowY: 'auto'}}>
                            {filteredComponents.length === 0 && (
                                <Text color="gray.400" textAlign="center" py={4}>
                                    No components found
                                </Text>
                            )}
                            {filteredComponents.map((comp, idx) => (
                                <Button
                                    key={comp.name}
                                    variant={safeSelectedIndex === idx ? 'solid' : 'ghost'}
                                    colorScheme={safeSelectedIndex === idx ? 'blue' : 'gray'}
                                    justifyContent="flex-start"
                                    borderRadius="md"
                                    fontWeight={safeSelectedIndex === idx ? 'bold' : 'normal'}
                                    onClick={() => setSelectedIndex(idx)}
                                    w="full"
                                    size="md"
                                >
                                    {comp.name}
                                </Button>
                            ))}
                        </VStack>
                    </Box>
                    {/* Showcase Area */}
                    <Box
                        flex={1}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={8}
                        shadow="sm"
                        minH="320px"
                    >
                        {selectedComponent ? (
                            <>
                                <Heading size="lg" color="blue.600" mb={2}>
                                    {selectedComponent.name}
                                </Heading>
                                <Text color="gray.600" mb={4}>
                                    {selectedComponent.description}
                                </Text>
                                <Divider mb={6} />
                                <Box border="2px solid" borderColor="#82e880" borderRadius="md" p={6}>
                                    {selectedComponent.component}
                                </Box>
                            </>
                        ) : (
                            <Text color="gray.400">No component selected.</Text>
                        )}
                    </Box>
                </Flex>
            </Container>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Browse Components</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <SimpleGrid columns={{base: 2, md: 3}} spacing={4}>
                            {componentList.map((name) => (
                                <Button
                                    key={name}
                                    variant="outline"
                                    onClick={() => {
                                        history.push(`/_dev/component-showcase?component=${name}`)
                                        onClose()
                                    }}
                                >
                                    {name}
                                </Button>
                            ))}
                        </SimpleGrid>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    )
}

ComponentShowcase.getProps = async () => {
    // This file is generated during the build process.
    try {
        const componentList = require('../../build/components.json')
        return {componentList}
    } catch (e) {
        console.error('Could not load components.json', e)
        // If the file doesn't exist, it's likely because the build script hasn't run.
        // We'll return an empty list to prevent a crash.
        return {componentList: []}
    }
}

ComponentShowcase.propTypes = {
    componentList: PropTypes.array
}

export default ComponentShowcase 