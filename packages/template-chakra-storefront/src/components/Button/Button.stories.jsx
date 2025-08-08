import React from 'react';
import { Button } from '@chakra-ui/react';

export default {
  title: 'Chakra UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Chakra UI Button component with various styles and sizes.'
      }
    }
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Button text'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Button size'
    },
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'link'],
      description: 'Button variant'
    },
    colorScheme: {
      control: 'select',
      options: ['blue', 'green', 'red', 'orange', 'purple', 'teal'],
      description: 'Button color scheme'
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disable button'
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading state'
    }
  }
};

export const Default = {
  args: {
    children: 'Default Button'
  }
};

export const Primary = {
  args: {
    children: 'Primary Button',
    colorScheme: 'blue',
    variant: 'solid'
  }
};

export const Secondary = {
  args: {
    children: 'Secondary Button',
    colorScheme: 'gray',
    variant: 'outline'
  }
};

export const Large = {
  args: {
    children: 'Large Button',
    size: 'lg',
    colorScheme: 'blue'
  }
};

export const Small = {
  args: {
    children: 'Small Button',
    size: 'sm',
    colorScheme: 'green'
  }
};

export const Loading = {
  args: {
    children: 'Loading Button',
    isLoading: true,
    colorScheme: 'blue'
  }
};

export const Disabled = {
  args: {
    children: 'Disabled Button',
    isDisabled: true,
    colorScheme: 'blue'
  }
};

export const Ghost = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
    colorScheme: 'purple'
  }
};

export const ButtonSizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="xs" colorScheme="blue">Extra Small</Button>
      <Button size="sm" colorScheme="blue">Small</Button>
      <Button size="md" colorScheme="blue">Medium</Button>
      <Button size="lg" colorScheme="blue">Large</Button>
    </div>
  )
};

export const ButtonVariants = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button variant="solid" colorScheme="blue">Solid</Button>
      <Button variant="outline" colorScheme="blue">Outline</Button>
      <Button variant="ghost" colorScheme="blue">Ghost</Button>
      <Button variant="link" colorScheme="blue">Link</Button>
    </div>
  )
};
