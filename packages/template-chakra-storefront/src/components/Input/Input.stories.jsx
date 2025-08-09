import React from 'react';
import { Input, Stack, Box, Text } from '@chakra-ui/react';

// Temporary Form component implementations for testing
const FormControl = ({ children, isInvalid, ...props }) => (
  <Box {...props}>
    {children}
  </Box>
);

const FormLabel = ({ children, ...props }) => (
  <Text as="label" fontSize="sm" fontWeight="medium" mb={1} {...props}>
    {children}
  </Text>
);

const FormHelperText = ({ children, ...props }) => (
  <Text fontSize="sm" color="gray.600" mt={1} {...props}>
    {children}
  </Text>
);

const FormErrorMessage = ({ children, ...props }) => (
  <Text fontSize="sm" color="red.500" mt={1} {...props}>
    {children}
  </Text>
);

// Temporary InputGroup component implementations
const InputGroup = ({ children, ...props }) => (
  <Box position="relative" {...props}>
    {children}
  </Box>
);

const InputLeftElement = ({ children, pointerEvents, ...props }) => (
  <Box
    position="absolute"
    left={3}
    top="50%"
    transform="translateY(-50%)"
    zIndex={2}
    pointerEvents={pointerEvents}
    {...props}
  >
    {children}
  </Box>
);

const InputRightElement = ({ children, pointerEvents, ...props }) => (
  <Box
    position="absolute"
    right={3}
    top="50%"
    transform="translateY(-50%)"
    zIndex={2}
    pointerEvents={pointerEvents}
    {...props}
  >
    {children}
  </Box>
);

export default {
  title: 'Chakra UI/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component: 'Chakra UI Input component for collecting user input.'
      }
    }
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Input placeholder text'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Input size'
    },
    variant: {
      control: 'select',
      options: ['outline', 'filled', 'flushed', 'unstyled'],
      description: 'Input variant'
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disable input'
    },
    isInvalid: {
      control: 'boolean',
      description: 'Show error state'
    },
    isReadOnly: {
      control: 'boolean',
      description: 'Make input read-only'
    }
  }
};

export const Default = {
  args: {
    placeholder: 'Enter text here...'
  }
};

export const WithLabel = {
  render: () => (
    <FormControl>
      <FormLabel>Email address</FormLabel>
      <Input type="email" placeholder="Enter your email" />
      <FormHelperText>We'll never share your email.</FormHelperText>
    </FormControl>
  )
};

export const WithError = {
  render: () => (
    <FormControl isInvalid>
      <FormLabel>Email address</FormLabel>
      <Input type="email" value="invalid-email" />
      <FormErrorMessage>Email is required and must be valid.</FormErrorMessage>
    </FormControl>
  )
};

export const WithLeftIcon = {
  render: () => (
    <InputGroup>
      <InputLeftElement pointerEvents="none">
        <span style={{ fontSize: '14px', color: 'gray' }}>🔍</span>
      </InputLeftElement>
      <Input placeholder="Search..." />
    </InputGroup>
  )
};

export const WithRightIcon = {
  render: () => (
    <InputGroup>
      <Input type="password" placeholder="Enter password" />
      <InputRightElement>
        <span style={{ fontSize: '14px', color: 'gray' }}>👁</span>
      </InputRightElement>
    </InputGroup>
  )
};

export const Sizes = {
  render: () => (
    <Stack spacing={3}>
      <Input placeholder="Extra small" size="xs" />
      <Input placeholder="Small" size="sm" />
      <Input placeholder="Medium" size="md" />
      <Input placeholder="Large" size="lg" />
    </Stack>
  )
};

export const Variants = {
  render: () => (
    <Stack spacing={3}>
      <Input placeholder="Outline variant" variant="outline" />
      <Input placeholder="Filled variant" variant="filled" />
      <Input placeholder="Flushed variant" variant="flushed" />
      <Input placeholder="Unstyled variant" variant="unstyled" />
    </Stack>
  )
};

export const States = {
  render: () => (
    <Stack spacing={3}>
      <Input placeholder="Normal input" />
      <Input placeholder="Disabled input" isDisabled />
      <Input placeholder="Read-only input" isReadOnly value="Cannot edit this" />
      <Input placeholder="Invalid input" isInvalid />
    </Stack>
  )
};

export const LoginForm = {
  render: () => (
    <Stack spacing={4} maxW="300px">
      <FormControl>
        <FormLabel>Username</FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <span style={{ fontSize: '14px', color: 'gray' }}>👤</span>
          </InputLeftElement>
          <Input placeholder="Enter username" />
        </InputGroup>
      </FormControl>
      
      <FormControl>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <span style={{ fontSize: '14px', color: 'gray' }}>🔒</span>
          </InputLeftElement>
          <Input type="password" placeholder="Enter password" />
          <InputRightElement>
            <span style={{ fontSize: '14px', color: 'gray' }}>👁</span>
          </InputRightElement>
        </InputGroup>
      </FormControl>
    </Stack>
  )
};
