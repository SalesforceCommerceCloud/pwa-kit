/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {z} from 'zod'
import fs from 'fs/promises'
import path from 'path'
import {toKebabCase, toPascalCase} from '../utils'

const systemPrompt = `
You are a smart assistant that helps create new React components.
Please ask the user for the following, one at a time:
1. What is the name of the new component?
2. What is the main purpose of this component? Please reply with exactly one of the following options:
   - Display a single Product
   - Display a list of Products
   - Other (please specify)
**Do not** assume answers. Collect all answers before proceeding.
Once the answers are provided, execute the createComponent tool with the collected information as input parameters.
`

const systemPromptForCustomComponent = `
You have chosen a custom purpose for your component.

Please provide the following details:
- What is the main purpose of this component?
- What are the requirements?
- What type of component is this? (presentational, container, form, etc.)

**Component Generation Guidelines:**
- Use functional components with hooks
- Use PascalCase for component names
- Use kebab-case for directories
- Start simple, expand only if requested
- One main purpose per component
- Components should be created in the components folder under PWA_STOREFRONT_APP_PATH, at: [PWA_STOREFRONT_APP_PATH]/components/[component-name]/index.jsx
`

const systemPromptForComponentPurpose = `
What is the main purpose of this component? Reply with exactly one of the following options: "Display a single Product", "Display a list of Products", or "Other (please specify)".`

class CreateNewComponentTool {
    constructor() {
        this.name = 'create_sample_component'
        this.description =
            'Create a sample React component. Gather information from user for the MCP tool parameters **one at a time**, in a natural and conversational way. Do **not** ask all the questions at once.'
        this.inputSchema = {
            componentName: z.string().min(1, 'The name of the new Component to create?'),
            purpose: z
                .string()
                .min(
                    1,
                    'The Purpose of the new component (e.g., Display a single Product, Display a list of Products or something else)'
                )
                .describe(systemPromptForComponentPurpose),
            location: z
                .string()
                .describe('The location of the component to be created')
                .default(process.env.PWA_STOREFRONT_APP_PATH)
        }
        this.handler = async (args) => {
            if (!args || !args.componentName || !args.purpose || !args.location) {
                return {
                    role: 'system',
                    content: [{type: 'text', text: systemPrompt}]
                }
            }
            const normalizedPurpose = args.purpose.trim().toLowerCase()
            const isSingleProduct = normalizedPurpose === 'display a single product'
            const isProductList = normalizedPurpose === 'display a list of products'

            if (isSingleProduct) {
                // Proceed with standard component creation
                return this.createComponent(args.componentName, args.location, 'singleProduct')
            } else if (isProductList) {
                return this.createComponent(args.componentName, args.location, 'productList')
            } else {
                // Custom purpose: let Cursor take over and ask clarifying questions
                return {
                    role: 'system',
                    content: [{type: 'text', text: systemPromptForCustomComponent}]
                }
            }
        }
    }

    async createComponent(componentName, location, entityType) {
        try {
            const result = await this.generateComponentFiles(componentName, location, entityType)
            return {
                role: 'system',
                content: [{type: 'text', text: result}]
            }
        } catch (error) {
            return {
                role: 'developer',
                content: [{type: 'text', text: `Error creating component: ${error.message}`}]
            }
        }
    }

    async generateComponentFiles(componentName, location, entityType) {
        const componentsDir = path.join(location, 'components')
        if (entityType === 'singleProduct' || entityType === 'productList') {
            // Call updateComponentToPresentational for product-based components
            return await this.updateComponentToPresentational(
                'product',
                componentName,
                componentsDir,
                {list: entityType === 'productList'}
            )
        }
    }

    async updateComponentToPresentational(entityType, componentName, location, options = {}) {
        const kebabDirName = toKebabCase(componentName)
        const pascalComponentName = toPascalCase(componentName)
        const componentDir = path.join(location, kebabDirName)
        await fs.mkdir(componentDir, {recursive: true})
        const componentFilePath = path.join(componentDir, 'index.jsx')
        let code = ''

        // Special logic for product entity
        if (entityType === 'product') {
            // If options.list is true, generate a list-of-products component
            if (options.list) {
                code = `
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Text, Image, Stack } from '@chakra-ui/react';

const ${pascalComponentName} = ({ products }) => (
    <Stack spacing={4}>
        {products.map(product => (
            <Box key={product.productId} borderWidth="1px" borderRadius="md" p={4}>
                <Text fontSize="xl" fontWeight="bold">{product.name}</Text>
                {product.imageGroups && product.imageGroups[0]?.images[0]?.link && (
                    <Image
                        src={product.imageGroups[0].images[0].link}
                        alt={product.name}
                        maxW="150px"
                        mb={2}
                    />
                )}
                <Text>assigned_categories: {product.assigned_categories?.toString?.() ?? ''}</Text>
                <Text>price: {product.price?.toString?.() ?? ''}</Text>
            </Box>
        ))}
    </Stack>
);

${pascalComponentName}.propTypes = {
    products: PropTypes.arrayOf(PropTypes.shape({
        productId: PropTypes.string,
        name: PropTypes.string,
        assigned_categories: PropTypes.any,
        price: PropTypes.any,
        imageGroups: PropTypes.array
    })).isRequired
};

export default ${pascalComponentName};
`
            } else {
                // Single product component (with selectors, image, etc.)
                code = `
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Text, Image, Button, HStack, Stack } from '@chakra-ui/react';

// Helper to filter variants by selected attribute values
const filterVariants = (variants, selected) => {
    return variants.filter(variant =>
        Object.entries(selected).every(
            ([attr, value]) => !value || variant.variationValues?.[attr] === value
        )
    );
};

// Helper to get the image for the selected color
const getImageForSelection = (imageGroups, selected) => {
    if (selected.color) {
        const group = imageGroups.find(
            g =>
                g.variationAttributes &&
                g.variationAttributes.some(
                    va =>
                        va.id === 'color' &&
                        va.values.some(v => v.value === selected.color)
                )
        );
        if (group && group.images.length > 0) {
            return group.images[0].link;
        }
    }
    if (imageGroups.length > 0 && imageGroups[0].images.length > 0) {
        return imageGroups[0].images[0].link;
    }
    return null;
};

const ${pascalComponentName} = ({ product }) => {
    const { variationAttributes = [], variants = [], imageGroups = [] } = product;
    const [selected, setSelected] = useState(() => {
        const initial = {};
        variationAttributes.forEach(attr => {
            initial[attr.id] = '';
        });
        return initial;
    });

    // Build a color code to swatch image URL map
    const swatchMap = {};
    imageGroups
        .filter(group => group.viewType === 'swatch')
        .forEach(group => {
            const colorCode = group.variationAttributes?.[0]?.values?.[0]?.value;
            if (colorCode && group.images[0]?.link) {
                swatchMap[colorCode] = group.images[0].link;
            }
        });

    const filteredVariants = filterVariants(variants, selected);
    const getAvailableValues = (attrId) => {
        const otherSelected = { ...selected };
        delete otherSelected[attrId];
        const possibleVariants = filterVariants(variants, otherSelected);
        const values = new Set();
        possibleVariants.forEach(v => {
            if (v.variationValues?.[attrId]) values.add(v.variationValues[attrId]);
        });
        return Array.from(values);
    };

    const imageUrl = getImageForSelection(imageGroups, selected);

    return (
        <Box>
            <Text fontSize="2xl" fontWeight="bold" mb={2}>{product.name}</Text>
            {imageUrl && (
                <Image src={imageUrl} alt={product.name} maxW="300px" mb={4} />
            )}
            <Text>assigned_categories: {product.assigned_categories?.toString?.() ?? ''}</Text>
            <Text>price: {product.price?.toString?.() ?? ''}</Text>
            {/* Dynamic variant attribute selectors */}
            {variationAttributes.map(attr => (
                <Box key={attr.id} my={2}>
                    <Text as="span" fontWeight="semibold">{attr.name}:</Text>
                    <HStack spacing={2} mt={1}>
                        {getAvailableValues(attr.id).map(val =>
                            attr.id === 'color' ? (
                                <Button
                                    key={val}
                                    onClick={() => setSelected(sel => ({ ...sel, [attr.id]: val }))}
                                    variant={selected[attr.id] === val ? 'solid' : 'outline'}
                                    borderRadius="full"
                                    minW="32px"
                                    h="32px"
                                    p={0}
                                    borderColor={
                                        selected[attr.id] === val ? 'blue.500' : 'gray.200'
                                    }
                                    _hover={{opacity: 0.8}}
                                    aria-label={val}
                                >
                                    {swatchMap[val] ? (
                                        <Image
                                            src={swatchMap[val]}
                                            alt={val}
                                            borderRadius="full"
                                            boxSize="28px"
                                        />
                                    ) : (
                                        val
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    key={val}
                                    onClick={() => setSelected(sel => ({ ...sel, [attr.id]: val }))}
                                    variant={selected[attr.id] === val ? 'solid' : 'outline'}
                                    colorScheme={selected[attr.id] === val ? 'blue' : 'gray'}
                                    borderRadius="md"
                                    size="sm"
                                >
                                    {val}
                                </Button>
                            )
                        )}
                    </HStack>
                </Box>
            ))}
        </Box>
    );
};

${pascalComponentName}.propTypes = {
    product: PropTypes.shape({
        name: PropTypes.string,
        assigned_categories: PropTypes.any,
        price: PropTypes.any,
        variationAttributes: PropTypes.array,
        variants: PropTypes.array,
        imageGroups: PropTypes.array
    }).isRequired
};

export default ${pascalComponentName};
`
            }
        } else {
            throw new Error(`Entity type '${entityType}' is not supported.`)
        }

        await fs.writeFile(componentFilePath, code, 'utf-8')
        return `✅ Updated ${componentFilePath} to presentational component for ${entityType}`
    }
}

export default CreateNewComponentTool
