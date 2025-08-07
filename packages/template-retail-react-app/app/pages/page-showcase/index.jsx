import React, {useState} from 'react'
import {
    Box,
    Button,
    Container,
    Heading,
    Input,
    VStack,
    Text,
    Divider,
    Flex
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useLocation, useHistory} from 'react-router-dom'
import ShowcaseTopBar from '@salesforce/retail-react-app/app/components/shared/ShowcaseTopBar'
import Home2 from '@salesforce/retail-react-app/app/pages/home2';
import { css } from '@emotion/react';
import componentMappings from '@salesforce/retail-react-app/app/componentMappings';

const pages = [
    {name: 'Home', path: '/'},
    {name: 'Cart', path: '/cart'},
    {name: 'Checkout', path: '/checkout'},
    {name: 'Account', path: '/account'},
    {name: 'Product List', path: '/category/womens-clothing-dresses'},
    {name: 'Product Detail', path: '/product/25518241M'},
    {name: 'Login', path: '/login'},
    {name: 'Registration', path: '/registration'},
    {name: 'Store Locator', path: '/store-locator'},
    {name: 'Page Not Found', path: '/page-not-found'},
    {name: 'Home2', path: '/home2'}
]

// Function to add hover and click effects to Salesforce components
const addHighlightingToComponents = (iframe) => {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return; // Ensure the document is accessible

    // Use a more specific selector if needed
    const components = doc.querySelectorAll('[data-salesforce-component]'); // Assuming components have a data attribute

    components.forEach(component => {
        component.style.transition = 'background-color 0.3s, border-color 0.3s';

        component.addEventListener('mouseenter', () => {
            component.style.backgroundColor = '#ffe6e6'; // Light red background
            component.style.borderColor = '#ff0000'; // Red border
            component.style.borderWidth = '2px';
            component.style.borderStyle = 'solid';
        });

        component.addEventListener('mouseleave', () => {
            component.style.backgroundColor = 'transparent';
            component.style.borderColor = 'transparent';
            component.style.borderWidth = '0px';
        });

        component.addEventListener('click', () => {
            console.log(`333333 !!!!!!!!! ====== Click event: ${component.tagName}`); // Debugging log
            alert(`Component clicked: ${component.tagName}`);
        });
    });
};

// Function to find the nearest parent with 'data-component' attribute
const findComponentElement = (element) => {
    //console.log(`====== Finding component element: ${element.tagName}`); // Debugging log
    while (element && element !== document) {
        if (element.tagName === 'DIV' && element.hasAttribute('data-component')) {
            //console.log(`Found component element: ${element.getAttribute('data-component')}`); // Debugging log
            return element;
        }
        element = element.parentElement;
    }
    return null;
};

// Function to add hover effects to only the topmost element within the iframe
// const addHoverEffectToTopElement = (iframe) => {
//     const doc = iframe.contentDocument || iframe.contentWindow.document;
//     if (!doc) return; // Ensure the document is accessible

//     // Remove any existing labels before creating a new one
//     const existingLabel = document.querySelector('.component-label');
//     if (existingLabel) {
//         existingLabel.remove();
//     }

//     // Revert to previous inline styles
//     const label = document.createElement('div'); // Append to parent document
//     label.className = 'component-label';
//     label.style.position = 'absolute'; // Use absolute positioning
//     label.style.backgroundColor = '#ff2255';
//     label.style.color = '#ffffff';
//     label.style.padding = '4px 5px';
//     label.style.borderRadius = '3px';
//     label.style.fontSize = '24px';
//     label.style.pointerEvents = 'none';
//     label.style.zIndex = '1000';
//     label.style.display = 'none';
//     document.body.appendChild(label);
//     console.log('!!!!!!Label csss', label.style); // 

//     console.log('Label created and appended to parent document'); // Debugging log

//     doc.addEventListener('mousemove', (event) => {
//         let element = doc.elementFromPoint(event.clientX, event.clientY);
//         console.log(`!!!!!!!!Element from point: ${element ? element.tagName : 'null'}`); // Debugging log
//         element = findComponentElement(element);

//         if (element && element !== lastElement) {
//             console.log(`Hovered element: ${element.tagName}, data-component: ${element.getAttribute('data-component')}`); // Debugging log

//             if (element) {
//                 if (lastElement) {
//                     lastElement.style.backgroundColor = 'transparent';
//                     lastElement.style.borderColor = 'transparent';
//                     lastElement.style.borderWidth = '0px';
//                 }

//                 element.style.transition = 'background-color 0.3s, border-color 0.3s';
//                 element.style.backgroundColor = '#ffe6e6'; // Light red background
//                 element.style.borderColor = '#ff0000'; // Red border
//                 element.style.borderWidth = '2px';
//                 element.style.borderStyle = 'solid';

//                 // Update label
//                 const componentName = element.getAttribute('data-component');
//                 label.textContent = componentName;
//                 const rect = iframe.getBoundingClientRect();
//                 label.style.left = `${rect.left + event.clientX + 10}px`;
//                 label.style.top = `${rect.top + event.clientY - 10}px`;
//                 label.style.fontSize = '24px';
//                 label.style.fontWeight = 'bold';
//                 label.style.display = 'block';

//                 console.log(`Label updated: ${label.textContent}, Position: (${label.style.left}, ${label.style.top})`); // Debugging log
//             } else {
//                 label.style.display = 'none';
//             }

//             lastElement = element;
//         }
//     });

//     doc.addEventListener('click', (event) => {
//         console.log(`222222 !!!!!!!!! ====== Click event: ${event.clientX}, ${event.clientY}`); // Debugging log
//         let element = doc.elementFromPoint(event.clientX, event.clientY);
//         console.log(`Element from point (click): ${element ? element.tagName : 'null'}`); // Debugging log
//         element = findComponentElement(element);
//         if (element) {
//             const componentName = element.getAttribute('data-component');
//             setSelectedComponentName(componentName);
//             console.log(`Clicked component: ${componentName}`); // Debugging log
//         }
//     });
// };

const PageShowcase = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [selectedComponentName, setSelectedComponentName] = useState('') // State for selected component name
    const location = useLocation()
    const history = useHistory()

    // Add to cart if empty
    const {data: basket, derivedData: {totalItems} = {}} = useCurrentBasket()
    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')
    React.useEffect(() => {
        if (basket && (basket.productItems?.length === 0 || totalItems === 0)) {
            addItemToBasket.mutate({
                parameters: {basketId: basket.basketId},
                body: {
                    productId: '25752981M', // Example productId
                    quantity: 1
                }
            })
        }
    }, [basket, totalItems])

    const filteredPages = searchTerm
        ? pages.filter(page =>
            page.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : pages

    const safeSelectedIndex =
        selectedIndex >= filteredPages.length ? 0 : selectedIndex
    const selectedPage = filteredPages[safeSelectedIndex]

    // Top bar navigation
    const goToPageShowcase = () => history.push('/_dev/page-showcase')
    const goToComponentShowcase = () => history.push('/_dev/component-showcase')
    const goToHooksShowcase = () => history.push('/_dev/hooks-showcase')

    // Function to add hover effects to only the topmost element within the iframe
    const addHoverEffectToTopElement = (iframe) => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return; // Ensure the document is accessible

        let lastElement = null;
        // Remove any existing labels before creating a new one
        const existingLabel = document.querySelector('.component-label');
        if (existingLabel) {
            existingLabel.remove();
        }

        // Revert to previous inline styles
        const label = document.createElement('div'); // Append to parent document
        label.className = 'component-label';
        label.style.position = 'absolute'; // Use absolute positioning
        label.style.backgroundColor = '#ff0000';//#E3C1F7
        label.style.opacity = '0.7';
        label.style.color = '#ffffff';
        label.style.padding = '5px';
        label.style.borderRadius = '5px';
        label.style.fontSize = '9px';
        label.style.fontWeight = 'bold';
        document.body.appendChild(label);

        console.log('Label created and appended to parent document'); // Debugging log

        doc.addEventListener('mousemove', (event) => {
            let element = doc.elementFromPoint(event.clientX, event.clientY);

            element = findComponentElement(element);
            if (element === null) {
                console.log(`No component element found`); // Debugging log
                return;
            }

            if (element !== lastElement) {
                //console.log(`Hovered element: ${element.tagName}, data-component: ${element.getAttribute('data-component')}`); // Debugging log

                if (element.tagName === 'DIV' && element.hasAttribute('data-component')) {
                    if (lastElement) {
                        lastElement.style.backgroundColor = 'transparent';
                        lastElement.style.borderColor = 'transparent';
                        lastElement.style.borderWidth = '0px';
                    }

                    element.style.transition = 'background-color 0.3s, border-color 0.3s';
                    element.style.backgroundColor = '#ffe6e6'; // Light red background
                    element.style.borderColor = '#ff0000'; // Red border
                    element.style.borderWidth = '2px';
                    element.style.borderStyle = 'solid';

                    // Update label
                    label.textContent = element.getAttribute('data-component');

                    const rect = element.getBoundingClientRect();
                    label.style.left = `${rect.left + iframe.offsetLeft + window.scrollX + 50}px`;
                    label.style.top = `${rect.top + iframe.offsetTop + window.scrollY - 10}px`;
                    label.style.display = 'block';
                    label.style.fontSize = '20px';

                    console.log('!!!!!!Label csss', label.style); // 

                    console.log(`Label updated: ${label.textContent}, Position: (${label.style.left}, ${label.style.top})`); // Debugging log
                } else {
                    label.style.display = 'none';
                }

                lastElement = element;
            }
        });

        doc.addEventListener('click', (event) => {
            console.log(`111111 !!!!!!!!! ====== Click event: ${event.clientX}, ${event.clientY}`); // Debugging log
            let element = doc.elementFromPoint(event.clientX, event.clientY);
            element = findComponentElement(element);
            if (element === null) {return;}
            console.log(`555555 !!!!!!!!! ====== Click event: ${element.getAttribute('data-component')}`); // Debugging log
            if (element && element.tagName === 'DIV' && element.hasAttribute('data-component')) {
                const componentName = element.getAttribute('data-component');
                setSelectedComponentName(componentName);
            }
        });
    };

    React.useEffect(() => {
        const handleBeforeUnload = () => {
            const labels = document.querySelectorAll('.component-label');
            labels.forEach(label => label.remove());
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            handleBeforeUnload();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <Box data-testid="page-showcase-page" layerStyle="page" minHeight="200vh">
            <ShowcaseTopBar />
            <Container maxW="container.2xl" py={8} minHeight="200vh">
                <Flex direction={{base: 'column', md: 'row'}} gap={8} align="flex-start">
                    {/* Sidebar */}
                    <Box
                        minW={{base: '100%', md: '260px'}}
                        maxW={{base: '100%', md: '260px'}}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={4}
                        shadow="sm"
                    >
                        <Input
                            mb={4}
                            placeholder="Search pages..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value)
                                setSelectedIndex(0)
                            }}
                        />
                        <VStack align="stretch" spacing={1} style={{maxHeight: '60vh', overflowY: 'auto'}}>
                            {filteredPages.length === 0 && (
                                <Text color="gray.400" textAlign="center" py={4}>
                                    No pages found
                                </Text>
                            )}
                            {filteredPages.map((page, idx) => (
                                <Button
                                    key={page.name}
                                    variant={safeSelectedIndex === idx ? 'solid' : 'ghost'}
                                    colorScheme={safeSelectedIndex === idx ? 'blue' : 'gray'}
                                    justifyContent="flex-start"
                                    borderRadius="md"
                                    fontWeight={safeSelectedIndex === idx ? 'bold' : 'normal'}
                                    onClick={() => setSelectedIndex(idx)}
                                    w="full"
                                    size="md"
                                >
                                    {page.name}
                                </Button>
                            ))}
                        </VStack>
                    </Box>
                    {/* Showcase Area */}
                    <Box
                        flex={2} // Increase the size of the middle pane
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={4}
                        shadow="sm"
                    >
                        {selectedPage ? (
                            <>
                                <Text size="md" color="blue.600" mb={2}>
                                    <b>{selectedPage.name} page</b> - <span style={{color: '#2D3748'}}>Path: <code>{selectedPage.path}</code></span>
                                </Text>
                                <Divider mb={6} />
                                <Box border="2px solid #82e880" borderRadius="md" overflow="hidden" minH="900px" bg="gray.50">
                                    <iframe
                                        title={selectedPage.name}
                                        src={selectedPage.path}
                                        style={{width: '100%', height: '1800px', border: 'none'}}
                                        onLoad={(e) => addHoverEffectToTopElement(e.target)}
                                    />
                                </Box>
                            </>
                        ) : (
                            <Text color="gray.400">No page selected.</Text>
                        )}
                    </Box>
                    {/* Component Inspector */}
                    <Box
                        flex={1} // Adjust to make the right pane about the same width
                        borderWidth="1px"
                        borderRadius="lg"
                        bg="white"
                        p={4}
                        shadow="sm"
                    >
                        <Heading size="md" mb={4}>Component Inspector</Heading>
                        <Text fontSize="2xl" mb={2}>Page: {selectedPage.name}</Text>
                        <Text fontSize="2xl" mb={2}>Component: {selectedComponentName || 'Click on a component to inspect'}</Text>
                        <Text fontSize="2xl" mb={2}>Parameters:</Text>
                        <Box as="table" width="100%" pl={4} borderWidth="1px" borderRadius="md">
                            <Box as="thead" bg="gray.100">
                                <Box as="tr">
                                    <Box as="th" textAlign="left" p={2} borderWidth="1px">Name</Box>
                                    <Box as="th" textAlign="left" p={2} borderWidth="1px">Type</Box>
                                </Box>
                            </Box>
                            <Box as="tbody">
                                {componentMappings[selectedComponentName]?.map(({name, type}) => (
                                    <Box as="tr" key={name}>
                                        <Box as="td" p={2} borderWidth="1px">{name}</Box>
                                        <Box as="td" p={2} borderWidth="1px">{type}</Box>
                                    </Box>
                                )) || <Box as="tr"><Box as="td" colSpan="2" p={2} textAlign="center">None</Box></Box>}
                            </Box>
                        </Box>
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}

export default PageShowcase 