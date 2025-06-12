    import React, {useState, Suspense} from 'react'
    import {Box, Heading, Text, Flex, Spinner, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
    import ShowcaseTopBar from '@salesforce/retail-react-app/app/components/shared/ShowcaseTopBar'
    import {Textarea} from '@chakra-ui/react'
    import {FormControl, FormLabel, Input} from '@chakra-ui/react'
    import {CloseButton} from '@chakra-ui/react'
    import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'
    import mockProduct from '../mocks/master-25517823M.js'
    import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
    import {mockedRegisteredCustomer} from '../mocks/mock-data.js'
    import {IconButton} from '@chakra-ui/react'
    import {CopyIcon} from '@chakra-ui/icons'
    import {useToast} from '@chakra-ui/react'
    const mockAddress = mockedRegisteredCustomer.addresses[0]
    
    const DEFAULT_CODE = `function Demo() {
    return <div style={{padding: 20, color: 'teal'}}>Hello from the Component Builder!</div>;
    }
    <Demo />`

    // Helper to update text in tree
    function updateTextInTree(tree, id, newText) {
        return tree.map(node => {
            if (node.id === id && node.type === 'Text') {
                return { ...node, text: newText }
            } else if (node.children) {
                return { ...node, children: updateTextInTree(node.children, id, newText) }
            }
            return node
        })
    }

    const ComponentBuilder = () => {
        const [code, setCode] = useState(DEFAULT_CODE)
        const [previewCode, setPreviewCode] = useState(DEFAULT_CODE)
        const isBrowser = typeof window !== 'undefined'
        const [componentName, setComponentName] = useState('')
        const [droppedComponents, setDroppedComponents] = useState([])
        const [draggedType, setDraggedType] = useState(null)
        const [hoveredId, setHoveredId] = useState(null)
        const [copying, setCopying] = useState(false)
        const toast = typeof window !== 'undefined' ? useToast() : null
        let idCounter = 0
        const getId = () => `comp_${idCounter++}_${Date.now()}`

        // Drag handlers
        const handleDragStart = (e, type) => {
            e.dataTransfer.setData('componentType', type)
            setDraggedType(type)
        }
        const handleDrop = (e, parentId = null) => {
            e.preventDefault()
            const type = e.dataTransfer.getData('componentType')
            if (type === 'Box' || type === 'Text' || type === 'ProductTile' || type === 'AddressDisplay') {
                const newNode = { id: getId(), type, children: type === 'Box' ? [] : undefined }
                if (!parentId) {
                    setDroppedComponents(prev => [...prev, newNode])
                } else {
                    setDroppedComponents(prev => addChildToTree(prev, parentId, newNode))
                }
            }
            setDraggedType(null)
        }
        const handleDragOver = (e) => {
            e.preventDefault()
        }

        // Recursively add child to tree
        function addChildToTree(tree, parentId, child) {
            return tree.map(node => {
                if (node.id === parentId && node.type === 'Box') {
                    return { ...node, children: [...(node.children || []), child] }
                } else if (node.children) {
                    return { ...node, children: addChildToTree(node.children, parentId, child) }
                }
                return node
            })
        }

        // Recursively remove a node by id from the tree
        function removeNodeById(tree, id) {
            return tree.filter(node => node.id !== id).map(node => {
                if (node.children) {
                    return { ...node, children: removeNodeById(node.children, id) }
                }
                return node
            })
        }

        // Recursively render tree
        function renderTree(nodes) {
            return nodes.map(node => {
                if (node.type === 'Box') {
                    return (
                        <Box
                            key={node.id}
                            borderWidth={1}
                            borderRadius="md"
                            p={2}
                            mb={2}
                            minH="40px"
                            onDrop={e => { e.stopPropagation(); handleDrop(e, node.id); }}
                            onDragOver={handleDragOver}
                            bg="blue.50"
                            position="relative"
                            borderColor={hoveredId === node.id ? 'blue.500' : 'gray.200'}
                            onMouseEnter={() => setHoveredId(node.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {hoveredId === node.id && (
                                <CloseButton
                                    size="sm"
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    zIndex={2}
                                    onClick={e => {
                                        e.stopPropagation();
                                        setDroppedComponents(tree => removeNodeById(tree, node.id))
                                    }}
                                />
                            )}
                            Box
                            {node.children && node.children.length > 0 && (
                                <Box mt={2} ml={4}>
                                    {renderTree(node.children)}
                                </Box>
                            )}
                            {draggedType && (
                                <Box position="absolute" top={0} right={0} fontSize="xs" color="gray.400">Drop here</Box>
                            )}
                        </Box>
                    )
                }
                if (node.type === 'Text') {
                    return (
                        <Box key={node.id}
                            borderColor={hoveredId === node.id ? 'blue.500' : 'gray.200'}
                            borderWidth={1}
                            borderRadius="md"
                            onMouseEnter={() => setHoveredId(node.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            position="relative"
                            p={2}
                            mb={2}
                        >
                            {hoveredId === node.id && (
                                <CloseButton
                                    size="sm"
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    zIndex={2}
                                    onClick={e => {
                                        e.stopPropagation();
                                        setDroppedComponents(tree => removeNodeById(tree, node.id))
                                    }}
                                />
                            )}
                            <Input
                                value={node.text ?? 'Text'}
                                fontWeight="bold"
                                onChange={e => setDroppedComponents(tree => updateTextInTree(tree, node.id, e.target.value))}
                                size="sm"
                            />
                        </Box>
                    )
                }
                if (node.type === 'ProductTile') {
                    return (
                        <Box key={node.id}
                            borderColor={hoveredId === node.id ? 'blue.500' : 'gray.200'}
                            borderWidth={1}
                            borderRadius="md"
                            onMouseEnter={() => setHoveredId(node.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            position="relative"
                            p={2}
                            mb={2}
                        >
                            {hoveredId === node.id && (
                                <CloseButton
                                    size="sm"
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    zIndex={2}
                                    onClick={e => {
                                        e.stopPropagation();
                                        setDroppedComponents(tree => removeNodeById(tree, node.id))
                                    }}
                                />
                            )}
                            <ProductTile product={mockProduct} />
                        </Box>
                    )
                }
                if (node.type === 'AddressDisplay') {
                    return (
                        <Box key={node.id}
                            borderColor={hoveredId === node.id ? 'blue.500' : 'gray.200'}
                            borderWidth={1}
                            borderRadius="md"
                            onMouseEnter={() => setHoveredId(node.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            position="relative"
                            p={2}
                            mb={2}
                        >
                            {hoveredId === node.id && (
                                <CloseButton
                                    size="sm"
                                    position="absolute"
                                    top={1}
                                    right={1}
                                    zIndex={2}
                                    onClick={e => {
                                        e.stopPropagation();
                                        setDroppedComponents(tree => removeNodeById(tree, node.id))
                                    }}
                                />
                            )}
                            <AddressDisplay address={mockAddress} />
                        </Box>
                    )
                }
                return null
            })
        }

        // Recursively generate JSX code
        function getJsxCode(nodes = droppedComponents, indent = 2, used = {Box: false, Text: false, ProductTile: false, AddressDisplay: false, mockProduct: false, mockAddress: false}) {
            const pad = ' '.repeat(indent)
            return nodes.map(node => {
                if (node.type === 'Box') {
                    used.Box = true
                    const childrenJsx = node.children && node.children.length > 0 ? '\n' + getJsxCode(node.children, indent + 2, used) + pad : ''
                    return `${pad}<Box>${childrenJsx}${childrenJsx ? '\n' + pad : ''}</Box>`
                }
                if (node.type === 'Text') {
                    used.Text = true
                    return `${pad}<Text>${node.text ?? 'Text'}</Text>`
                }
                if (node.type === 'ProductTile') {
                    used.ProductTile = true
                    used.mockProduct = true
                    return `${pad}<ProductTile product={mockProduct} />`
                }
                if (node.type === 'AddressDisplay') {
                    used.AddressDisplay = true
                    used.mockAddress = true
                    return `${pad}<AddressDisplay address={mockAddress} />`
                }
                return ''
            }).join('\n')
        }

        // Generate a complete React component file as a string
        function getFullComponentCode() {
            // Track which imports are needed
            const used = {Box: false, Text: false, ProductTile: false, AddressDisplay: false, mockProduct: false, mockAddress: false}
            const jsx = getJsxCode(droppedComponents, 4, used)
            const imports = []
            if (used.Box || used.Text) {
                imports.push(`import {Box${used.Text ? ', Text' : ''}} from '@salesforce/retail-react-app/app/components/shared/ui'`)
            }
            if (used.ProductTile) {
                imports.push(`import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'`)
            }
            if (used.AddressDisplay) {
                imports.push(`import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'`)
            }
            if (used.mockProduct) {
                imports.push(`import mockProduct from '../mocks/master-25517823M.js'`)
            }
            if (used.mockAddress) {
                imports.push(`import {mockedRegisteredCustomer} from '../mocks/mock-data.js'`)
            }
            let mockAddressDef = ''
            if (used.mockAddress) {
                mockAddressDef = '\nconst mockAddress = mockedRegisteredCustomer.addresses[0]'
            }
            const name = componentName.trim() ? componentName.trim() : 'Component'
            return `import React from 'react'
${imports.join('\n')}
${mockAddressDef}

const ${name} = () => (\n  <>\n${jsx}\n  </>\n)

export default ${name}
`
        }

        return (
            <Box data-testid="component-builder-page" layerStyle="page">
                <ShowcaseTopBar />
                <Flex maxW="container.xl" mx="auto" py={8} px={4} gap={8} direction={{base: 'column', md: 'row'}}>
                    {/* Left Pane: Components */}
                    <Box flexBasis="220px" flexShrink={0} minW="180px" maxW="260px" borderWidth={1} borderRadius="md" p={4} bg="gray.50" mb={{base: 4, md: 0}}>
                        <Heading as="h3" size="sm" mb={3}>Components</Heading>
                        <Box as="ul" pl={0} style={{listStyle: 'none'}}>
                           
                            <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'Box')} cursor="grab"><Text>Box</Text></Box>
                            <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'AddressDisplay')} cursor="grab"><Text>address-display</Text></Box>
                            <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'Text')} cursor="grab"><Text>Text</Text></Box>
                            <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'ProductTile')} cursor="grab"><Text>product-tile</Text></Box>
                            {/* Add more component names here as needed */}
                        </Box>
                    </Box>
                    {/* Middle Pane: Drop Target and Rendered Components */}
                    <Box flex={1} minW={0} mx="auto">
                        <FormControl mb={4}>
                            <FormLabel htmlFor="component-name">Component Name</FormLabel>
                            <Flex gap={2}>
                                <Input
                                    id="component-name"
                                    placeholder="Enter component name"
                                    value={componentName}
                                    onChange={e => setComponentName(e.target.value)}
                                />
                                <Button
                                    colorScheme="blue"
                                    size="md"
                                    onClick={() => {
                                        if (componentName.trim()) {
                                           // createEmptyComponent(componentName.trim())
                                        }
                                    }}
                                >
                                    Create
                                </Button>
                            </Flex>
                        </FormControl>
                        <Box
                            borderWidth={1}
                            borderRadius="md"
                            p={4}
                            minH="300px"
                            bg="white"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            {droppedComponents.length === 0 && <Text color="gray.400">Drag Box or Text here</Text>}
                            {renderTree(droppedComponents)}
                        </Box>
                        <Button
                            mt={4}
                            colorScheme="red"
                            size="md"
                            variant="outline"
                            onClick={() => setDroppedComponents([])}
                            w="full"
                        >
                            Clear
                        </Button>
                    </Box>
                    {/* Right Pane: JSX Code */}
                    <Box flexBasis="340px" flexShrink={0} minW="220px" maxW="400px" borderWidth={1} borderRadius="md" p={4} bg="gray.50" ml={{base: 0, md: 4}} mt={{base: 4, md: 0}} position="relative">
                        <Heading as="h3" size="sm" mb={3} pr={10}>
                            JSX Code
                        </Heading>
                        <IconButton
                            aria-label="Copy code"
                            icon={<CopyIcon />}
                            size="sm"
                            position="absolute"
                            top={4}
                            right={4}
                            zIndex={2}
                            onClick={async () => {
                                setCopying(true);
                                await navigator.clipboard.writeText(getFullComponentCode());
                                setTimeout(() => setCopying(false), 1500);
                            }}
                            colorScheme={copying ? 'green' : 'gray'}
                            title={copying ? 'Copied!' : 'Copy to clipboard'}
                        />
                        <Textarea value={getFullComponentCode()} readOnly minH="300px" fontFamily="mono" fontSize="sm" bg="white" />
                        <Button
                            mt={4}
                            colorScheme="green"
                            onClick={() => {
                                const code = getFullComponentCode();
                                const name = componentName.trim() ? componentName.trim() : 'Component';
                                const blob = new Blob([code], {type: 'text/plain'});
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = `${name}.jsx`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }}
                        >
                            Save
                        </Button>
                    </Box>
                </Flex>
            </Box>
        )
    }

    export default ComponentBuilder 