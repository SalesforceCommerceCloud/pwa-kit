import React from 'react';
import { Badge, Stack, Text } from '@chakra-ui/react';

export default {
  title: 'Chakra UI/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: 'Chakra UI Badge component for highlighting status or categories.'
      }
    }
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Badge text'
    },
    variant: {
      control: 'select',
      options: ['solid', 'subtle', 'outline'],
      description: 'Badge variant'
    },
    colorScheme: {
      control: 'select',
      options: ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink'],
      description: 'Badge color scheme'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size'
    }
  }
};

export const Default = {
  args: {
    children: 'Badge'
  }
};

export const Success = {
  args: {
    children: 'Success',
    colorScheme: 'green'
  }
};

export const Warning = {
  args: {
    children: 'Warning',
    colorScheme: 'orange'
  }
};

export const Error = {
  args: {
    children: 'Error',
    colorScheme: 'red'
  }
};

export const Info = {
  args: {
    children: 'Info',
    colorScheme: 'blue'
  }
};

export const Variants = {
  render: () => (
    <Stack direction="row" spacing={4}>
      <Badge variant="solid" colorScheme="green">Solid</Badge>
      <Badge variant="subtle" colorScheme="green">Subtle</Badge>
      <Badge variant="outline" colorScheme="green">Outline</Badge>
    </Stack>
  )
};

export const Colors = {
  render: () => (
    <Stack direction="row" spacing={2} wrap="wrap">
      <Badge colorScheme="gray">Gray</Badge>
      <Badge colorScheme="red">Red</Badge>
      <Badge colorScheme="orange">Orange</Badge>
      <Badge colorScheme="yellow">Yellow</Badge>
      <Badge colorScheme="green">Green</Badge>
      <Badge colorScheme="teal">Teal</Badge>
      <Badge colorScheme="blue">Blue</Badge>
      <Badge colorScheme="cyan">Cyan</Badge>
      <Badge colorScheme="purple">Purple</Badge>
      <Badge colorScheme="pink">Pink</Badge>
    </Stack>
  )
};

export const Sizes = {
  render: () => (
    <Stack direction="row" spacing={4} align="center">
      <Badge size="sm" colorScheme="blue">Small</Badge>
      <Badge size="md" colorScheme="blue">Medium</Badge>
      <Badge size="lg" colorScheme="blue">Large</Badge>
    </Stack>
  )
};

export const WithText = {
  render: () => (
    <Stack spacing={4}>
      <Text>
        Product Status: <Badge colorScheme="green">In Stock</Badge>
      </Text>
      <Text>
        Order Status: <Badge colorScheme="orange">Processing</Badge>
      </Text>
      <Text>
        User Role: <Badge colorScheme="purple">Admin</Badge>
      </Text>
    </Stack>
  )
};

export const ProductStatuses = {
  render: () => (
    <Stack spacing={3}>
      <div>
        <Text fontWeight="bold" mb={2}>Product Statuses:</Text>
        <Stack direction="row" spacing={2}>
          <Badge colorScheme="green" variant="solid">In Stock</Badge>
          <Badge colorScheme="orange" variant="solid">Low Stock</Badge>
          <Badge colorScheme="red" variant="solid">Out of Stock</Badge>
          <Badge colorScheme="blue" variant="solid">New Arrival</Badge>
          <Badge colorScheme="purple" variant="solid">Best Seller</Badge>
        </Stack>
      </div>
      
      <div>
        <Text fontWeight="bold" mb={2}>Order Statuses:</Text>
        <Stack direction="row" spacing={2}>
          <Badge colorScheme="yellow" variant="outline">Pending</Badge>
          <Badge colorScheme="blue" variant="outline">Processing</Badge>
          <Badge colorScheme="orange" variant="outline">Shipped</Badge>
          <Badge colorScheme="green" variant="outline">Delivered</Badge>
          <Badge colorScheme="red" variant="outline">Cancelled</Badge>
        </Stack>
      </div>
    </Stack>
  )
};
