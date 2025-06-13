import React, {useState, Suspense} from 'react'
import {Box, Heading, Text, Flex, Spinner, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {VStack, HStack, SimpleGrid} from '@chakra-ui/react'
import {Image} from '@chakra-ui/react'
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
import { 
    ViewIcon, 
    RepeatIcon, 
    AtSignIcon, 
    StarIcon,
    PhotoIcon
} from '@chakra-ui/icons'
const mockAddress = mockedRegisteredCustomer.addresses[0]

const DEFAULT_CODE = `function Demo() {
    return <div style={{padding: 20, color: 'teal'}}>Hello from the Component Builder!</div>;
    }
    <Demo />`

// Helper to update text in tree
function updateTextInTree(tree, id, newText) {
    if (!tree) return []
    return tree.map(node => {
        if (!node) return null
        if (node.id === id && node.type === 'Text') {
            return { ...node, text: newText }
        } else if (node.children) {
            // For SimpleGrid, VStack, and HStack, preserve the array structure
            if (node.type === 'SimpleGrid' || node.type === 'VStack' || node.type === 'HStack') {
                const updatedChildren = node.children.map(child => 
                    child ? updateTextInTree([child], id, newText)[0] : null
                )
                return { ...node, children: updatedChildren }
            }
            // For other components with children
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
    const handleDrop = (e, parentId = null, cellIndex = null) => {
        e.preventDefault()
        const type = e.dataTransfer.getData('componentType')
        if (type === 'Box' || type === 'Text' || type === 'ProductTile' || type === 'AddressDisplay' || 
            type === 'VStack' || type === 'HStack' || type === 'SimpleGrid' || type === 'Image') {
            const newNode = { 
                id: getId(), 
                type, 
                children: ['Box', 'VStack', 'HStack', 'SimpleGrid'].includes(type) ? 
                    (type === 'SimpleGrid' ? Array(9).fill(null) : 
                     type === 'VStack' || type === 'HStack' ? Array(3).fill(null) : []) : undefined,
                cellIndex,
                src: type === 'Image' ? 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg' : undefined
            }
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
            if (node.id === parentId) {
                if (node.type === 'SimpleGrid') {
                    // For SimpleGrid, we need to find the specific cell
                    const cellIndex = parseInt(child.cellIndex)
                    // Ensure we have a full array of 9 cells
                    const newChildren = Array(9).fill(null)
                    // Copy existing children if they exist
                    if (node.children) {
                        node.children.forEach((existingChild, index) => {
                            newChildren[index] = existingChild
                        })
                    }
                    // Add the new child to the specific cell
                    newChildren[cellIndex] = child
                    return { ...node, children: newChildren }
                } else if (node.type === 'VStack' || node.type === 'HStack') {
                    // For VStack and HStack, handle 3 cells
                    const cellIndex = parseInt(child.cellIndex)
                    const newChildren = Array(3).fill(null)
                    if (node.children) {
                        node.children.forEach((existingChild, index) => {
                            newChildren[index] = existingChild
                        })
                    }
                    newChildren[cellIndex] = child
                    return { ...node, children: newChildren }
                } else if (node.type === 'Box') {
                    return { ...node, children: [...(node.children || []), child] }
                }
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
                if (node.type === 'SimpleGrid') {
                    // For SimpleGrid, we need to handle the array of children differently
                    return { 
                        ...node, 
                        children: node.children.map(child => 
                            child && child.id === id ? null : child
                        )
                    }
                }
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
                        {node.type}
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
            if (node.type === 'VStack' || node.type === 'HStack') {
                const Component = node.type === 'HStack' ? HStack : VStack
                const cells = node.children || Array(3).fill(null)
                return (
                    <Component
                        key={node.id}
                        borderWidth={1}
                        borderRadius="md"
                        p={2}
                        mb={2}
                        spacing={2}
                        bg="blue.50"
                        position="relative"
                        borderColor={hoveredId === node.id ? 'blue.500' : 'gray.200'}
                        onMouseEnter={() => setHoveredId(node.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onDrop={e => { e.stopPropagation(); handleDrop(e, node.id); }}
                        onDragOver={handleDragOver}
                        width="100%"
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
                        {cells.map((child, index) => (
                            <Box
                                key={index}
                                borderWidth={1}
                                borderRadius="md"
                                p={2}
                                bg="white"
                                minH="40px"
                                position="relative"
                                onDrop={e => { e.stopPropagation(); handleDrop(e, node.id, index); }}
                                onDragOver={handleDragOver}
                                flex={node.type === 'HStack' ? 1 : undefined}
                            >
                                {child ? (
                                    renderTree([child])
                                ) : (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        color="gray.400"
                                        fontSize="sm"
                                        minH="40px"
                                    >
                                        Cell {index + 1}
                                    </Box>
                                )}
                                {draggedType && (
                                    <Box position="absolute" top={0} right={0} fontSize="xs" color="gray.400">Drop here</Box>
                                )}
                            </Box>
                        ))}
                    </Component>
                )
            }
            if (node.type === 'SimpleGrid') {
                const cells = node.children || Array(9).fill(null)
                return (
                    <SimpleGrid
                        key={node.id}
                        borderWidth={1}
                        borderRadius="md"
                        p={2}
                        mb={2}
                        columns={3}
                        spacing={2}
                        bg="blue.50"
                        position="relative"
                        borderColor={hoveredId === node.id ? 'blue.500' : 'gray.200'}
                        onMouseEnter={() => setHoveredId(node.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onDrop={e => { e.stopPropagation(); handleDrop(e, node.id); }}
                        onDragOver={handleDragOver}
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
                        {cells.map((child, index) => (
                            <Box
                                key={index}
                                borderWidth={1}
                                borderRadius="md"
                                p={2}
                                bg="white"
                                minH="40px"
                                position="relative"
                                onDrop={e => { e.stopPropagation(); handleDrop(e, node.id, index); }}
                                onDragOver={handleDragOver}
                            >
                                {child ? (
                                    renderTree([child])
                                ) : (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        color="gray.400"
                                        fontSize="sm"
                                        minH="40px"
                                    >
                                        Cell {index + 1}
                                    </Box>
                                )}
                                {draggedType && (
                                    <Box position="absolute" top={0} right={0} fontSize="xs" color="gray.400">Drop here</Box>
                                )}
                            </Box>
                        ))}
                    </SimpleGrid>
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
            if (node.type === 'Image') {
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
                        <Box
                            as="img"
                            src="https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg"
                            alt="Product Image"
                            width="150px"
                            height="150px"
                            objectFit="cover"
                            borderRadius="md"
                        />
                    </Box>
                )
            }
            return null
        })
    }

    // Recursively generate JSX code
    function getJsxCode(nodes = droppedComponents, indent = 2, used = {
        Box: false, 
        Text: false, 
        ProductTile: false, 
        AddressDisplay: false, 
        VStack: false,
        HStack: false,
        SimpleGrid: false,
        Image: false,
        mockProduct: false, 
        mockAddress: false
    }) {
        const pad = ' '.repeat(indent)
        return nodes.map(node => {
            if (node.type === 'Box') {
                used.Box = true
                const childrenJsx = node.children && node.children.length > 0 ? '\n' + getJsxCode(node.children, indent + 2, used) + pad : ''
                return `${pad}<Box>${childrenJsx}${childrenJsx ? '\n' + pad : ''}</Box>`
            }
            if (node.type === 'VStack' || node.type === 'HStack') {
                used[node.type] = true
                const childrenJsx = node.children ? node.children
                    .map((child, index) => {
                        if (child) {
                            return getJsxCode([child], indent + 2, used)
                        }
                        return `${pad}  <Box key="${index}" p={2} bg="gray.50" borderRadius="md" flex={${node.type === 'HStack' ? 1 : 'undefined'}}>Cell ${index + 1}</Box>`
                    })
                    .join('\n') : ''
                return `${pad}<${node.type} spacing={2} width="100%">\n${childrenJsx}\n${pad}</${node.type}>`
            }
            if (node.type === 'SimpleGrid') {
                used.SimpleGrid = true
                const childrenJsx = node.children ? node.children
                    .map((child, index) => {
                        if (child) {
                            return getJsxCode([child], indent + 2, used)
                        }
                        return `${pad}  <Box key="${index}" p={2} bg="gray.50" borderRadius="md">Cell ${index + 1}</Box>`
                    })
                    .join('\n') : ''
                return `${pad}<SimpleGrid columns={3} spacing={2}>\n${childrenJsx}\n${pad}</SimpleGrid>`
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
            if (node.type === 'Image') {
                used.Image = true
                return `${pad}<Box as="img" src="https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2ad3abd7/images/medium/PG.10219685.JJ169XX.PZ.jpg" alt="Product Image" width="150px" height="150px" objectFit="cover" borderRadius="md" />`
            }
            return ''
        }).join('\n')
    }

    // Generate a complete React component file as a string
    function getFullComponentCode() {
        // Track which imports are needed
        const used = {
            Box: false, 
            Text: false, 
            ProductTile: false, 
            AddressDisplay: false, 
            VStack: false,
            HStack: false,
            SimpleGrid: false,
            Image: false,
            mockProduct: false, 
            mockAddress: false
        }
        const jsx = getJsxCode(droppedComponents, 4, used)
        const imports = []
        const uiComponents = ['Box', 'Text', 'VStack', 'HStack', 'SimpleGrid'].filter(comp => used[comp])
        if (uiComponents.length > 0) {
            imports.push(`import {${uiComponents.join(', ')}} from '@chakra-ui/react'`)
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
        if (used.Image) {
            imports.push(`import {Image} from '@chakra-ui/react'`)
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
                <Box flexBasis="220px" flexShrink={0} minW="180px" maxW="260px" borderWidth={1} borderRadius="md" p={4} bg="gray.50" mb={{base: 4, md: 0}} minH="600px">
                    <Heading as="h3" size="sm" mb={3}>Components</Heading>
                    <Box as="ul" pl={0} style={{listStyle: 'none'}}>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'Box')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <Box as="span" boxSize={4} borderWidth={1} borderRadius="sm" />
                                <Text>Box</Text>
                            </Flex>
                        </Box>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'VStack')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <ViewIcon boxSize={4} />
                                <Text>VStack</Text>
                            </Flex>
                        </Box>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'HStack')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <RepeatIcon boxSize={4} />
                                <Text>HStack</Text>
                            </Flex>
                        </Box>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'SimpleGrid')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <Box as="span" boxSize={4} display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="1px">
                                    <Box bg="currentColor" />
                                    <Box bg="currentColor" />
                                    <Box bg="currentColor" />
                                    <Box bg="currentColor" />
                                </Box>
                                <Text>SimpleGrid</Text>
                            </Flex>
                        </Box>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'AddressDisplay')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <AtSignIcon boxSize={4} />
                                <Text>address-display</Text>
                            </Flex>
                        </Box>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'Text')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <Box as="span" boxSize={4} fontSize="xs" fontWeight="bold">T</Box>
                                <Text>Text</Text>
                            </Flex>
                        </Box>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'ProductTile')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <StarIcon boxSize={4} />
                                <Text>product-tile</Text>
                            </Flex>
                        </Box>
                        <Box as="li" mb={2} draggable onDragStart={e => handleDragStart(e, 'Image')} cursor="grab">
                            <Flex align="center" gap={2}>
                                <Box 
                                    boxSize={4} 
                                    borderWidth={1} 
                                    borderRadius="sm"
                                    bg="gray.100"
                                    position="relative"
                                    _after={{
                                        content: '""',
                                        position: 'absolute',
                                        top: '25%',
                                        left: '25%',
                                        width: '50%',
                                        height: '50%',
                                        borderWidth: '1px',
                                        borderRadius: 'sm',
                                        borderColor: 'gray.400'
                                    }}
                                />
                                <Text>Image</Text>
                            </Flex>
                        </Box>
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
                        minH="600px"
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
                <Box flexBasis="340px" flexShrink={0} minW="220px" maxW="400px" borderWidth={1} borderRadius="md" p={4} bg="gray.50" ml={{base: 0, md: 4}} mt={{base: 4, md: 0}} position="relative" minH="600px">
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
                    <Textarea value={getFullComponentCode()} readOnly minH="500px" fontFamily="mono" fontSize="sm" bg="white" />
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