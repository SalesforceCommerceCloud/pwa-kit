import React from 'react';
import { Box, Stack, SimpleGrid, AspectRatio, Text, Badge, HStack } from '@chakra-ui/react';
import {
  mockStandardProductHit,
  mockMasterProductHitWithMultipleVariants,
  mockMasterProductHitWithOneVariant,
  mockProductSearchItem,
  mockProductSetHit
} from '../../../mocks/product-search-hit-data';

const SimpleProductTile = ({ product, enableFavourite, isFavourite, onFavouriteToggle }) => {
  return (
    <Box 
      borderWidth="1px" 
      borderColor="gray.200" 
      borderRadius="md" 
      overflow="hidden"
      position="relative"
      bg="white"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      {/* Product Image */}
      <AspectRatio ratio={1}>
        <Box
          bg="gray.100"
          display="flex"
          alignItems="center"
          justifyContent="center"
          backgroundImage={product.image?.disBaseLink ? `url(${product.image.disBaseLink})` : undefined}
          backgroundSize="cover"
          backgroundPosition="center"
        >
          {!product.image?.disBaseLink && (
            <Text color="gray.500" fontSize="sm">Product Image</Text>
          )}
        </Box>
      </AspectRatio>

      {/* Product Info */}
      <Box p={3}>
        <Text fontWeight="medium" fontSize="sm" noOfLines={2} mb={2}>
          {product.productName || product.name}
        </Text>
        
        <Text fontWeight="bold" color="gray.900" fontSize="lg">
          ${product.price?.toFixed(2)}
        </Text>

        {/* Badges */}
        {product.representedProduct?.isNew && (
          <HStack mt={2}>
            <Badge colorScheme="blue" size="sm">NEW</Badge>
            {product.representedProduct?.isOnSale && (
              <Badge colorScheme="red" size="sm">SALE</Badge>
            )}
          </HStack>
        )}
      </Box>

      {/* Favourite Button */}
      {enableFavourite && (
        <Box position="absolute" top={2} right={2}>
          <Box
            as="button"
            p={2}
            borderRadius="full"
            bg="white"
            shadow="sm"
            onClick={() => onFavouriteToggle?.(!isFavourite)}
            _hover={{ shadow: 'md' }}
          >
            {isFavourite ? '❤️' : '🤍'}
          </Box>
        </Box>
      )}
    </Box>
  );
};

const ProductTileSkeleton = () => (
  <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
    <AspectRatio ratio={1}>
      <Box bg="gray.200" />
    </AspectRatio>
    <Box p={3}>
      <Box h="4" bg="gray.200" rounded="md" mb={2} />
      <Box h="6" bg="gray.200" rounded="md" w="20" />
    </Box>
  </Box>
);

// Using real mock data from the mocks folder
// These contain realistic product data structures that match the actual API responses

export default {
  title: 'Commerce/ProductTile',
  component: SimpleProductTile,
  parameters: {
    docs: {
      description: {
        component: 'ProductTile component displays product information in a compact, visual format. Supports standard products, master/variant products, promotions, and wishlist functionality.'
      }
    }
  },
  argTypes: {
    enableFavourite: {
      control: 'boolean',
      description: 'Enable wishlist functionality'
    },
    isFavourite: {
      control: 'boolean',
      description: 'Show product as favourited'
    },
    imageViewType: {
      control: 'select',
      options: ['large', 'medium', 'small'],
      description: 'Image size variant'
    },
    selectableAttributeId: {
      control: 'text',
      description: 'Attribute ID for variant selection (default: color)'
    },
    isRefreshingData: {
      control: 'boolean',
      description: 'Show loading skeleton for pricing'
    }
  }
};

export const Default = {
  args: {
    product: mockStandardProductHit
  }
};

export const WithFavourite = {
  args: {
    product: mockStandardProductHit,
    enableFavourite: true,
    isFavourite: false,
    onFavouriteToggle: (isFavourite) => {
      console.log('Favourite toggled:', isFavourite);
    }
  }
};

export const FavouritedProduct = {
  args: {
    product: mockStandardProductHit,
    enableFavourite: true,
    isFavourite: true,
    onFavouriteToggle: (isFavourite) => {
      console.log('Favourite toggled:', isFavourite);
    }
  }
};

export const MasterProductWithVariants = {
  args: {
    product: mockMasterProductHitWithMultipleVariants
  }
};

export const MasterProductWithFavourite = {
  args: {
    product: mockMasterProductHitWithMultipleVariants,
    enableFavourite: true,
    isFavourite: false,
    onFavouriteToggle: (isFavourite) => {
      console.log('Favourite toggled:', isFavourite);
    }
  }
};

export const SingleVariant = {
  args: {
    product: mockMasterProductHitWithOneVariant
  }
};

export const ProductSearchItem = {
  args: {
    product: mockProductSearchItem
  }
};

export const LoadingState = {
  args: {
    product: mockMasterProductHitWithMultipleVariants,
    isRefreshingData: true
  }
};

export const LoadingSkeleton = {
  render: () => <ProductTileSkeleton />
};

export const ProductGrid = {
  render: () => (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
      <SimpleProductTile product={mockStandardProductHit} />
      <SimpleProductTile 
        product={mockMasterProductHitWithMultipleVariants} 
        enableFavourite={true}
        isFavourite={false}
        onFavouriteToggle={(isFav) => console.log('Toggled:', isFav)}
      />
      <SimpleProductTile product={mockProductSearchItem} />
      <SimpleProductTile 
        product={mockMasterProductHitWithOneVariant}
        enableFavourite={true}
        isFavourite={true}
        onFavouriteToggle={(isFav) => console.log('Toggled:', isFav)}
      />
      <SimpleProductTile product={mockProductSetHit} />
      <SimpleProductTile product={mockStandardProductHit} />
      <ProductTileSkeleton />
      <SimpleProductTile product={mockMasterProductHitWithMultipleVariants} />
    </SimpleGrid>
  )
};

export const DifferentProductTypes = {
  render: () => (
    <Stack spacing={6}>
      <Box>
        <h3>Different Product Types</h3>
        <SimpleGrid columns={3} spacing={4} mt={2}>
          <Box>
            <Text fontSize="sm" mb={2} fontWeight="bold">Standard Product</Text>
            <SimpleProductTile product={mockStandardProductHit} />
          </Box>
          <Box>
            <Text fontSize="sm" mb={2} fontWeight="bold">Master Product (Multiple Variants)</Text>
            <SimpleProductTile product={mockMasterProductHitWithMultipleVariants} />
          </Box>
          <Box>
            <Text fontSize="sm" mb={2} fontWeight="bold">Product Set</Text>
            <SimpleProductTile product={mockProductSetHit} />
          </Box>
        </SimpleGrid>
      </Box>
    </Stack>
  )
};

export const WishlistShowcase = {
  render: () => (
    <Stack spacing={4}>
      <h3>Wishlist Functionality</h3>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Box>
          <p><strong>Not Favourited</strong></p>
          <SimpleProductTile 
            product={mockStandardProductHit}
            enableFavourite={true}
            isFavourite={false}
            onFavouriteToggle={(isFav) => console.log('Standard product toggled:', isFav)}
          />
        </Box>
        <Box>
          <p><strong>Favourited</strong></p>
          <SimpleProductTile 
            product={mockMasterProductHitWithMultipleVariants}
            enableFavourite={true}
            isFavourite={true}
            onFavouriteToggle={(isFav) => console.log('Master product toggled:', isFav)}
          />
        </Box>
        <Box>
          <p><strong>Product Search Item</strong></p>
          <SimpleProductTile 
            product={mockProductSearchItem}
            enableFavourite={true}
            isFavourite={true}
            onFavouriteToggle={(isFav) => console.log('Search item toggled:', isFav)}
          />
        </Box>
        <Box>
          <p><strong>Single Variant</strong></p>
          <SimpleProductTile 
            product={mockMasterProductHitWithOneVariant}
            enableFavourite={true}
            isFavourite={false}
            onFavouriteToggle={(isFav) => console.log('Single variant toggled:', isFav)}
          />
        </Box>
      </SimpleGrid>
    </Stack>
  )
};
