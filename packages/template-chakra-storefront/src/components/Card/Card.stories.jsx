import React from 'react';
import { Box, Heading, Text, Button, Stack } from '@chakra-ui/react';

// Temporary simple Card implementation for testing
const Card = ({ children, maxW, variant, size, ...props }) => (
  <Box 
    border="1px solid" 
    borderColor="gray.200" 
    borderRadius="md" 
    p={4} 
    maxW={maxW}
    shadow={variant === 'elevated' ? 'md' : 'none'}
    {...props}
  >
    {children}
  </Box>
);

const CardHeader = ({ children }) => (
  <Box mb={3}>
    {children}
  </Box>
);

const CardBody = ({ children }) => (
  <Box mb={3}>
    {children}
  </Box>
);

const CardFooter = ({ children }) => (
  <Box>
    {children}
  </Box>
);

export default {
  title: 'Chakra UI/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component: 'Chakra UI Card component for displaying content in a structured layout.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'outline', 'filled', 'unstyled'],
      description: 'Card variant'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card size'
    }
  }
};

export const Default = {
  args: {
    variant: 'elevated'
  },
  render: (args) => (
    <Card {...args} maxW="sm">
      <CardBody>
        <Text>This is a default card with some content.</Text>
      </CardBody>
    </Card>
  )
};

export const WithHeader = {
  render: () => (
    <Card maxW="sm">
      <CardHeader>
        <Heading size="md">Card with Header</Heading>
      </CardHeader>
      <CardBody>
        <Text>This card includes a header section with a title.</Text>
      </CardBody>
    </Card>
  )
};

export const WithFooter = {
  render: () => (
    <Card maxW="sm">
      <CardHeader>
        <Heading size="md">Card with Footer</Heading>
      </CardHeader>
      <CardBody>
        <Text>This card includes both header and footer sections.</Text>
      </CardBody>
      <CardFooter>
        <Button colorScheme="blue">Action</Button>
      </CardFooter>
    </Card>
  )
};

export const ProductCard = {
  render: () => (
    <Card maxW="sm" variant="elevated">
      <CardHeader>
        <Heading size="md">Product Name</Heading>
      </CardHeader>
      <CardBody>
        <Stack spacing={3}>
          <Text color="gray.600">$29.99</Text>
          <Text>High-quality product with amazing features and benefits for everyday use.</Text>
        </Stack>
      </CardBody>
      <CardFooter>
        <Stack direction="row" spacing={4}>
          <Button variant="outline">View Details</Button>
          <Button colorScheme="blue">Add to Cart</Button>
        </Stack>
      </CardFooter>
    </Card>
  )
};

export const CardVariants = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <Card maxW="200px" variant="elevated">
        <CardBody>
          <Text fontSize="sm">Elevated</Text>
        </CardBody>
      </Card>
      <Card maxW="200px" variant="outline">
        <CardBody>
          <Text fontSize="sm">Outline</Text>
        </CardBody>
      </Card>
      <Card maxW="200px" variant="filled">
        <CardBody>
          <Text fontSize="sm">Filled</Text>
        </CardBody>
      </Card>
    </Stack>
  )
};

export const CardSizes = {
  render: () => (
    <Stack spacing={4}>
      <Card size="sm" maxW="300px">
        <CardBody>
          <Text>Small card size</Text>
        </CardBody>
      </Card>
      <Card size="md" maxW="300px">
        <CardBody>
          <Text>Medium card size</Text>
        </CardBody>
      </Card>
      <Card size="lg" maxW="300px">
        <CardBody>
          <Text>Large card size</Text>
        </CardBody>
      </Card>
    </Stack>
  )
};
