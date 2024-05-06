/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {Component as ComponentType} from '../types'
import {usePageContext} from '../Page'
import JsxParser from 'react-jsx-parser'

type ComponentProps = {
    component: ComponentType
}

const ComponentNotFound = ({typeId}: {typeId: string}) => (
    <div>{`Component type '${typeId}' not found!`}</div>
)

// The main use case for the JSX parser is to leverage eGPT Generative Components
// from page designer. At the moment, only Chakra UI components are supported. There isn't
// a good place to put this list of required components, so we'll just put it here for now.
// In the future, we need to have a place to share the list.
export const REQUIRED_EGPT_JSX_COMPONENTS = [
    'Accordion',
    'AccordionButton',
    'AccordionIcon',
    'AccordionItem',
    'AccordionPanel',
    'Alert',
    'AlertDialog',
    'AlertDialogBody',
    'AlertDialogContent',
    'AlertDialogFooter',
    'AlertDialogHeader',
    'AlertDialogOverlay',
    'AlertIcon',
    'AlertTitle',
    'AspectRatio',
    'Badge',
    'Box',
    'Breadcrumb',
    'BreadcrumbItem',
    'BreadcrumbLink',
    'Button',
    'ButtonGroup',
    'Center',
    'ChakraProvider',
    'Checkbox',
    'CloseButton',
    'Container',
    'Divider',
    'Drawer',
    'DrawerBody',
    'DrawerCloseButton',
    'DrawerContent',
    'DrawerFooter',
    'DrawerHeader',
    'DrawerOverlay',
    'Fade',
    'Flex',
    'FormControl',
    'FormErrorMessage',
    'FormLabel',
    'Grid',
    'GridItem',
    'HStack',
    'Heading',
    'Icon',
    'IconButton',
    'Image',
    'Img',
    'Input',
    'InputGroup',
    'InputLeftElement',
    'InputRightElement',
    'Link',
    'List',
    'ListItem',
    'Modal',
    'ModalBody',
    'ModalCloseButton',
    'ModalContent',
    'ModalFooter',
    'ModalHeader',
    'ModalOverlay',
    'Popover',
    'PopoverArrow',
    'PopoverBody',
    'PopoverCloseButton',
    'PopoverContent',
    'PopoverFooter',
    'PopoverHeader',
    'PopoverTrigger',
    'Portal',
    'Radio',
    'RadioGroup',
    'Select',
    'SimpleGrid',
    'Skeleton',
    'Spacer',
    'Spinner',
    'Stack',
    'StackDivider',
    'StylesProvider',
    'Text',
    'Tooltip',
    'VStack',
    'Wrap',
    'WrapItem'
]

/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param {PageProps} props
 * @param {Component} props.component - The page designer component data representation.
 * @returns {React.ReactElement} - Experience component.
 */
export const Component = ({component}: ComponentProps) => {
    const pageContext = usePageContext()
    const {jsxParserComponents} = pageContext
    const {custom, data, typeId, ...rest} = component
    const {code} = data || {}
    const isEinsteinAssistedComponent = typeId === 'headless.einsteinAssisted'
    const products = custom?.products || []
    let instance = <ComponentNotFound typeId={typeId} />
    useEffect(() => {
        if (isEinsteinAssistedComponent) {
            const missingJsxComponents = REQUIRED_EGPT_JSX_COMPONENTS.filter((required) => {
                return !jsxParserComponents?.[required]
            })
            Boolean(missingJsxComponents.length) &&
                console.error(
                    '[Page Designer Einstein Assisted Component] - The following component implementation are missing: ',
                    missingJsxComponents.join(', ') + '.\n',
                    'You must ensure the "jsxParserComponents" prop of the <Page/> component includes these components, otherwise the component may fail to render.'
                )
        }
    }, [code?.code])

    if (isEinsteinAssistedComponent && !code?.code?.react) {
        return null
    }

    if (isEinsteinAssistedComponent && code?.code?.react) {
        // TODO: this is a workaround for the fact that
        // 'react-jsx-parser' still uses React@16 typings
        // we need to cast it to the newer React typings
        const JsxParserComponent = JsxParser as unknown as React.ElementType
        instance = (
            <JsxParserComponent
                components={pageContext.jsxParserComponents}
                // TODO: make component data structure more clear
                // from the PD custom editor, let's not have "code.code"
                jsx={code.code.react}
                {...component}
                bindings={{
                    products
                }}
            />
        )
    } else if (pageContext?.components[component.typeId]) {
        const ComponentClass = pageContext?.components[component.typeId]
        instance = <ComponentClass {...component} />
    }

    return (
        <div id={component.id} className="component">
            <div className="container">{instance}</div>
        </div>
    )
}

Component.displayName = '[Page Designer] Component'

export default Component
