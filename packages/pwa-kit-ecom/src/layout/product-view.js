/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

import PropTypes from 'prop-types'
import {HideOnDesktop, HideOnMobile} from '../components/responsive'

import {Box, Flex, useMultiStyleConfig, VStack} from '@chakra-ui/react'

const ImageGallery = () => null
const SwatchGroup = () => null
const ActionButtons = () => null
const Header = () => null
const QuantityPicker = () => null
const ErrorMessage = () => null
const Footer = () => null

const ProductViewLayout = ({children, variant}) => {
    const imageGallery = children.find((el) => el.type === ImageGallery)
    const header = children.find((el) => el.type === Header)
    const footer = children.find((el) => el.type === Footer)
    const swatchGroup = children.find((el) => el.type === SwatchGroup)
    const quantityPicker = children.find((el) => el.type === QuantityPicker)
    const error = children.find((el) => el.type === ErrorMessage)
    const actionButtons = children.find((el) => el.type === ActionButtons)

    const styles = useMultiStyleConfig('ProductViewLayout', {variant})
    console.log('styles', styles)
    return (
        <Flex data-testid="product-view" {...styles.container}>
            {/* Basic information etc. title, price, breadcrumb*/}
            <HideOnDesktop {...styles.headerMobile}>
                {header ? header.props.children : null}
            </HideOnDesktop>
            <Flex {...styles.body}>
                <Box data-testid="image-wrapper" {...styles.gallery}>
                    {imageGallery ? imageGallery.props.children : null}
                </Box>

                {/* Variations & Quantity Selector */}
                <VStack {...styles.buySection}>
                    <HideOnMobile {...styles.headerDesktop}>
                        {header ? header.props.children : null}
                    </HideOnMobile>

                    <VStack {...styles.swatchGroupContainer}>
                        {swatchGroup ? swatchGroup.props.children : null}
                    </VStack>

                    <VStack {...styles.quantityPickerContainer}>
                        {quantityPicker ? quantityPicker.props.children : null}
                    </VStack>

                    <Box {...styles.errorMessage}>{error ? error.props.children : null}</Box>

                    <HideOnMobile {...styles.actionButtonDesktop}>
                        {actionButtons ? actionButtons.props.children : null}
                    </HideOnMobile>
                </VStack>
            </Flex>

            <HideOnDesktop {...styles.actionButtonsMobile}>
                {actionButtons ? actionButtons.props.children : null}
            </HideOnDesktop>

            <Box {...styles.footer}>{footer ? footer.props.children : null}</Box>
        </Flex>
    )
}

ProductViewLayout.propTypes = {}
ProductViewLayout.Header = Header
ProductViewLayout.ImageGallery = ImageGallery
ProductViewLayout.SwatchGroup = SwatchGroup
ProductViewLayout.QuantityPicker = QuantityPicker
ProductViewLayout.ActionButtons = ActionButtons
ProductViewLayout.ErrorMessage = ErrorMessage
ProductViewLayout.Footer = Footer

export default ProductViewLayout
