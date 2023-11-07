/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Component as ComponentType} from '../types'
import {usePageContext} from '../Page'
import JsxParser from 'react-jsx-parser'

type ComponentProps = {
    component: ComponentType
    code?: string
}

const ComponentNotFound = ({typeId}: ComponentType) => (
    <div>{`Component type '${typeId}' not found!`}</div>
)

// The main use case for the JSX parser is to leverage eGPT Generative Components
// from page designer. At the moment, only Chakra UI components are supported. There isn't
// a good place to put this list of required components, so we'll just put it here for now.
// In the future, we need to have a place to share the list.
export const REQUIRED_EGPT_JSX_COMPONENTS = [
    './Accordion',
    './AccordionButton',
    './AccordionIcon',
    './AccordionItem',
    './AccordionPanel',
    './Alert',
    './AlertDialog',
    './AlertDialogBody',
    './AlertDialogContent',
    './AlertDialogFooter',
    './AlertDialogHeader',
    './AlertDialogOverlay',
    './AlertIcon',
    './AlertTitle',
    './AspectRatio',
    './Badge',
    './Box',
    './Breadcrumb',
    './BreadcrumbItem',
    './BreadcrumbLink',
    './Button',
    './ButtonGroup',
    './Center',
    './ChakraProvider',
    './Checkbox',
    './CloseButton',
    './Container',
    './Divider',
    './Drawer',
    './DrawerBody',
    './DrawerCloseButton',
    './DrawerContent',
    './DrawerFooter',
    './DrawerHeader',
    './DrawerOverlay',
    './Fade',
    './Flex',
    './FormControl',
    './FormErrorMessage',
    './FormLabel',
    './Grid',
    './GridItem',
    './HStack',
    './Heading',
    './Icon',
    './IconButton',
    './Image',
    './Img',
    './Input',
    './InputGroup',
    './InputLeftElement',
    './InputRightElement',
    './Link',
    './List',
    './ListItem',
    './Modal',
    './ModalBody',
    './ModalCloseButton',
    './ModalContent',
    './ModalFooter',
    './ModalHeader',
    './ModalOverlay',
    './Popover',
    './PopoverArrow',
    './PopoverBody',
    './PopoverCloseButton',
    './PopoverContent',
    './PopoverFooter',
    './PopoverHeader',
    './PopoverTrigger',
    './Portal',
    './Radio',
    './RadioGroup',
    './Select',
    './SimpleGrid',
    './Skeleton',
    './Spacer',
    './Spinner',
    './Stack',
    './StackDivider',
    './StylesProvider',
    './Text',
    './Tooltip',
    './VStack',
    './Wrap',
    './WrapItem'
]

/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param {PageProps} props
 * @param {Component} props.component - The page designer component data representation.
 * @param {string} [props.code] - The raw JSW code for the component.
 * @returns {React.ReactElement} - Experience component.
 */
export const Component = ({component, code}: ComponentProps) => {
    const pageContext = usePageContext()
    const {data, ...rest} = component
    let instance = <ComponentNotFound {...rest} {...data} />
    if (code) {
        instance = (
            <JsxParser
                components={pageContext?.jsxParserComponents}
                jsx={code}
                {...rest}
                {...data}
            />
        )
    } else if (pageContext?.components[component.typeId]) {
        const ComponentClass = pageContext?.components[component.typeId]
        instance = <ComponentClass {...rest} {...data} />
    }

    return (
        <div id={component.id} className="component">
            <div className="container">{instance}</div>
        </div>
    )
}

Component.displayName = 'Component'

export default Component
