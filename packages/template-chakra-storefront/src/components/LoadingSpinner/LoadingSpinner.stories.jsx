import React from 'react';
import { Spinner, Stack, Text, Box } from '@chakra-ui/react';

export default {
  title: 'Chakra UI/LoadingSpinner',
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component: 'Chakra UI Spinner component for indicating loading states.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Spinner size'
    },
    color: {
      control: 'color',
      description: 'Spinner color'
    },
    thickness: {
      control: 'text',
      description: 'Thickness of the spinner'
    },
    speed: {
      control: 'text',
      description: 'Animation speed'
    },
    label: {
      control: 'text',
      description: 'Accessibility label'
    }
  }
};

export const Default = {
  args: {
    size: 'md',
    label: 'Loading...'
  }
};

export const Small = {
  args: {
    size: 'sm',
    label: 'Loading...'
  }
};

export const Large = {
  args: {
    size: 'lg',
    label: 'Loading...'
  }
};

export const CustomColor = {
  args: {
    size: 'lg',
    color: 'blue.500',
    label: 'Loading...'
  }
};

export const Sizes = {
  render: () => (
    <Stack direction="row" spacing={6} align="center">
      <Box textAlign="center">
        <Spinner size="xs" />
        <Text fontSize="sm" mt={2}>XS</Text>
      </Box>
      <Box textAlign="center">
        <Spinner size="sm" />
        <Text fontSize="sm" mt={2}>Small</Text>
      </Box>
      <Box textAlign="center">
        <Spinner size="md" />
        <Text fontSize="sm" mt={2}>Medium</Text>
      </Box>
      <Box textAlign="center">
        <Spinner size="lg" />
        <Text fontSize="sm" mt={2}>Large</Text>
      </Box>
      <Box textAlign="center">
        <Spinner size="xl" />
        <Text fontSize="sm" mt={2}>XL</Text>
      </Box>
    </Stack>
  )
};

export const Colors = {
  render: () => (
    <Stack direction="row" spacing={6} align="center">
      <Box textAlign="center">
        <Spinner color="red.500" size="lg" />
        <Text fontSize="sm" mt={2}>Red</Text>
      </Box>
      <Box textAlign="center">
        <Spinner color="blue.500" size="lg" />
        <Text fontSize="sm" mt={2}>Blue</Text>
      </Box>
      <Box textAlign="center">
        <Spinner color="green.500" size="lg" />
        <Text fontSize="sm" mt={2}>Green</Text>
      </Box>
      <Box textAlign="center">
        <Spinner color="purple.500" size="lg" />
        <Text fontSize="sm" mt={2}>Purple</Text>
      </Box>
      <Box textAlign="center">
        <Spinner color="orange.500" size="lg" />
        <Text fontSize="sm" mt={2}>Orange</Text>
      </Box>
    </Stack>
  )
};

export const WithText = {
  render: () => (
    <Stack spacing={6}>
      <Box textAlign="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} fontSize="lg">Loading your content...</Text>
      </Box>
      
      <Box textAlign="center">
        <Spinner size="md" color="green.500" />
        <Text mt={2}>Saving changes...</Text>
      </Box>
      
      <Box display="flex" alignItems="center" justifyContent="center">
        <Spinner size="sm" color="purple.500" mr={3} />
        <Text>Processing your request</Text>
      </Box>
    </Stack>
  )
};

export const LoadingStates = {
  render: () => (
    <Stack spacing={6}>
      <Box p={6} border="1px" borderColor="gray.200" borderRadius="md" textAlign="center">
        <Text fontWeight="bold" mb={4}>Page Loading</Text>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">Please wait while we load your dashboard...</Text>
      </Box>
      
      <Box p={4} border="1px" borderColor="gray.200" borderRadius="md" display="flex" alignItems="center">
        <Spinner size="sm" color="green.500" mr={3} />
        <Text>Uploading file: document.pdf (45%)</Text>
      </Box>
      
      <Box p={4} border="1px" borderColor="gray.200" borderRadius="md" display="flex" alignItems="center">
        <Spinner size="sm" color="orange.500" mr={3} />
        <Text>Synchronizing data...</Text>
      </Box>
    </Stack>
  )
};

export const InlineSpinner = {
  render: () => (
    <Box>
      <Text display="flex" alignItems="center">
        Refreshing data <Spinner size="sm" ml={2} />
      </Text>
    </Box>
  )
};
