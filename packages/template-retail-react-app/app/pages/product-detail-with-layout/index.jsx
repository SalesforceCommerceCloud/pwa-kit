/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import {useLocation} from 'react-router-dom'

// Components
import {
    Box,
    Button, 
    Grid, 
    GridItem, 
    Modal,
    ModalContent,
    ModalCloseButton,
    ModalOverlay
} from '@chakra-ui/react'
import {Portal as TemplateItem} from './components'

const Template = ({children, preset}) => {
    const Preset = Template.presets[preset.toLowerCase()]

    return (
        <Box layerStyle="page">
            <Preset />

            {/* Children At Bottom Always */}
            {children}
        </Box>
    )
}

Template.presets = {
    ['pdp-1']: () => {
        return (
            <Grid
                h='600px'
                templateRows='repeat(20, 1fr)'
                templateColumns='repeat(2, 1fr)'
                gap={2}
            >
                {/* Carousel */}
                <GridItem id="carousel" rowSpan={8} colSpan={1} bg='tomato' borderRadius={4} paddingLeft={2} />

                {/* Breadcrumb */}
                <GridItem id="breadcrumb" rowSpan={1} colSpan={1} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                {/* Name */}
                <GridItem id="title" rowSpan={1} colSpan={1} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                {/* Price */}
                <GridItem id="price" rowSpan={1} colSpan={1} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                {/* Attributes */}
                <GridItem id="attributes" rowSpan={5} colSpan={1} bg='skyblue' borderRadius={4} paddingLeft={2} />

                {/* Description */}
                <GridItem id="description" rowSpan={4} colSpan={1} bg='DarkKhaki' borderRadius={4} paddingLeft={2} />

                {/* Suggested Items */}
                <GridItem id="suggestions" rowSpan={4} colSpan={2} bg='SeaGreen' borderRadius={4} paddingLeft={2} />

                {/* Recently Viewed Items */}
                <GridItem id="viewed" rowSpan={4} colSpan={2} bg='LightSteelBlue' borderRadius={4} paddingLeft={2} />
            </Grid>
        )
    },
    ['pdp-2']: () => {
        return (
            <Grid
                h='600px'
                templateRows='repeat(20, 1fr)'
                templateColumns='repeat(2, 1fr)'
                gap={2}
            >
                {/* Breadcrumb */}
                <GridItem id="breadcrumb" rowSpan={1} colSpan={2} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                {/* Title */}
                <GridItem id="title" rowSpan={1} colSpan={2} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                {/* Price */}
                <GridItem id="price" rowSpan={1} colSpan={2} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                {/* Attributes */}
                <GridItem id="attributes" rowSpan={5} colSpan={1} bg='skyblue' borderRadius={4} paddingLeft={2} />

                {/* Carousel */}
                <GridItem id="carousel" rowSpan={8} colSpan={1} bg='tomato' borderRadius={4} paddingLeft={2} />

                {/* Description */}
                <GridItem id="description" rowSpan={3} colSpan={1} bg='DarkKhaki' borderRadius={4} paddingLeft={2} />

                {/* Suggested Items */}
                <GridItem id="suggestions" rowSpan={4} colSpan={1} bg='SeaGreen' borderRadius={4} paddingLeft={2} />

                {/* Recently Viewed Items */}
                <GridItem id="viewed" rowSpan={4} colSpan={1} bg='LightSteelBlue' borderRadius={4} paddingLeft={2} />
            </Grid>
        )
    },
    ['pdp-3']: () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
            <Box>
                <Modal
                    isOpen={isOpen}
                    onClose={() => {setIsOpen(false)}}
                    size="xl"
                    motionPreset="slideInBottom"
                    scrollBehavior="inside"
                >
                    <ModalOverlay />
                    <ModalContent top={0} marginTop={0}>
                        <Box id="suggestions" bg='SeaGreen' borderRadius={4} paddingLeft={2} height={200} />
                        <ModalCloseButton />
                        
                    </ModalContent>
                </Modal>
                
                <Button marginBottom={2} onClick={() => {setIsOpen(true)}}>Show Related Products</Button>

                <Grid
                    h='600px'
                    templateRows='repeat(20, 1fr)'
                    templateColumns='repeat(2, 1fr)'
                    gap={2}
                >
                    {/* Carousel */}
                    <GridItem id="carousel" rowSpan={8} colSpan={1} bg='tomato' borderRadius={4} paddingLeft={2} />

                    {/* Breadcrumb */}
                    <GridItem id="breadcrumb" rowSpan={1} colSpan={1} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                    {/* Name */}
                    <GridItem id="title" rowSpan={1} colSpan={1} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                    {/* Price */}
                    <GridItem id="price" rowSpan={1} colSpan={1} bg='papayawhip' borderRadius={4} paddingLeft={2} />

                    {/* Attributes */}
                    <GridItem id="attributes" rowSpan={5} colSpan={1} bg='skyblue' borderRadius={4} paddingLeft={2} />

                    {/* Description */}
                    <GridItem id="description" rowSpan={4} colSpan={1} bg='DarkKhaki' borderRadius={4} paddingLeft={2} />

                    {/* Recently Viewed Items */}
                    <GridItem id="viewed" rowSpan={4} colSpan={2} bg='LightSteelBlue' borderRadius={4} paddingLeft={2} />
                </Grid>
            </Box>
        )
    }
}

const ProductDetailWithLayout = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const preset = searchParams.get('preset') || 'pdp-1'

    return (
        <Template data-testid="portals-page" layerStyle="page" preset={preset}>
            <TemplateItem rootId="price">
                <b>Price</b>
            </TemplateItem>

            <TemplateItem rootId="breadcrumb">
                <b>Breadcrumb</b>
            </TemplateItem>

            <TemplateItem rootId="title">
                <b>Title</b>
            </TemplateItem>

            <TemplateItem rootId="carousel">
                <b>Images</b>
            </TemplateItem>

            <TemplateItem rootId="description">
                <b>Description</b>    
            </TemplateItem>

            <TemplateItem rootId="suggestions">
                <b>Suggestions</b>
            </TemplateItem>

            <TemplateItem rootId="viewed">
                <b>Previously Viewed</b>
            </TemplateItem>

            <TemplateItem rootId="attributes">
                <b>Attributes</b>
            </TemplateItem>
        </Template>
    )
}

ProductDetailWithLayout.getTemplateName = () => 'portals'

export default ProductDetailWithLayout
