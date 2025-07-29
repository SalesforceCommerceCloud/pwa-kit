/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'
import {toKebabCase, toPascalCase, getCopyrightHeader} from '../utils'

// Utility to infer entity from component name
function inferEntityFromComponentName(componentName) {
    const name = componentName.toLowerCase()
    if (name.includes('customer')) return 'customer'
    if (name.includes('product')) return 'product'
    if (name.includes('basket')) return 'basket'
    if (name.includes('category')) return 'category'
    return null
}

class CreateNewComponentTool {
    constructor() {
        this.currentStep = 0
        this.componentData = {
            name: null,
            location: null,
            entityType: null
        }
    }

    /**
     * Creates the component based on all collected data
     * @returns {Promise<string>} The result of component creation
     */
    async createComponent() {
        const messages = []

        // Use the provided absolute path directly if available
        const location = this.componentData.location
        const componentMessage = await this.createComponentFile(this.componentData.name, location)
        messages.push(componentMessage)

        // Handle entity type information
        if (this.componentData.entityType) {
            messages.push(
                `\nℹ️ Entity type '${this.componentData.entityType}' ${
                    inferEntityFromComponentName(this.componentData.name)
                        ? 'was inferred'
                        : 'was specified'
                } for component '${this.componentData.name}'.`
            )
        } else {
            messages.push(
                `\nℹ️ No entity type was specified or could be inferred for component '${this.componentData.name}'.`
            )
        }

        // Always append lint reminder
        messages.push(
            "\n💡 After creating or modifying a component, run 'npm run lint -- --fix' to automatically fix formatting and linter issues."
        )

        // Reset for next use
        this.reset()

        return messages.join('\n')
    }

    /**
     * Resets the tool state for the next component creation
     */
    reset() {
        this.currentStep = 0
        this.componentData = {
            name: null,
            location: null,
            entityType: null
        }
    }

    /**
     * Creates a new React component file.
     * @param {string} componentName - Name for the new component.
     * @param {string} projectDir - The absolute path to the project directory for the new component.
     */
    async createComponentFile(componentName, projectDir) {
        const kebabDirName = toKebabCase(componentName)
        const pascalComponentName = toPascalCase(componentName)
        const componentDir = path.join(projectDir, kebabDirName)
        try {
            await fs.mkdir(componentDir, {recursive: true})
            // Create component file
            const componentFilePath = path.join(componentDir, 'index.jsx')
            const codeToWrite = `${getCopyrightHeader()}
import React from 'react';

const ${pascalComponentName} = () => {
  return (
    <div>${pascalComponentName} component</div>
  );
};

export default ${pascalComponentName};
`
            await fs.writeFile(componentFilePath, codeToWrite, 'utf-8')
            return `✅ Created ${componentFilePath}`
        } catch (err) {
            console.error('Error during file creation:', err)
            return `❌ Error creating component file at ${componentDir}: ${err.message}`
        }
    }

    /**
     * Updates the component file to be a presentational component for the given data model.
     * @param {string} entityType - The entity type (e.g., 'product').
     * @param {string} componentName - The component name.
     * @param {string} location - The absolute path to the component's parent directory.
     * @param {object} dataModel - The data model schema (properties object).
     */
    async updateComponentToPresentational(
        entityType,
        componentName,
        location,
        dataModel,
        options = {}
    ) {
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
                code = `${getCopyrightHeader()}
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
                code = `${getCopyrightHeader()}
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
