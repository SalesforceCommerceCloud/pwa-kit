/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box, useTheme, Text, VisuallyHidden} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

const steps = ['Ordered', 'Dispatched', 'Out for delivery', 'Delivered']

const OrderStatusBar = ({currentStepLabel}) => {
    const theme = useTheme()
    const intl = useIntl()

    const getLocalizedMessage = (status) => {
        switch (status) {
            case 'Ordered':
                return intl.formatMessage({id: 'status_bar.ordered', defaultMessage: 'Ordered'})
            case 'Dispatched':
                return intl.formatMessage({
                    id: 'status_bar.dispatched',
                    defaultMessage: 'Dispatched'
                })
            case 'Out for delivery':
                return intl.formatMessage({
                    id: 'status_bar.out_for_delivery',
                    defaultMessage: 'Out for delivery'
                })
            case 'Delivered':
                return intl.formatMessage({id: 'status_bar.delivered', defaultMessage: 'Delivered'})
            default:
                return status
        }
    }

    // Helper to get step fill color based on current step
    const getStepFillColor = (stepIndex) => {
        if (stepIndex < currentStep) {
            return theme.colors.teal[100] // completed steps
        } else if (stepIndex === currentStep) {
            return theme.colors.blue[900] // current step
        } else {
            return theme.colors.gray[200] // future steps
        }
    }

    // Helper to get label text color based on current step
    const getLabelColor = (stepIndex) => {
        if (stepIndex < currentStep) {
            return theme.colors.black[600] // completed steps
        } else if (stepIndex === currentStep) {
            return 'white' // current step
        } else {
            return theme.colors.black[600] // future steps
        }
    }

    const n = steps.length
    const svgWidth = 1080
    const svgHeight = 50
    const chevronWidth = 24
    const radius = 25

    // Dynamically calculate step width so all steps + chevrons fit in svgWidth
    const stepWidth = (svgWidth + (n - 1) * chevronWidth) / n

    let currentStep = steps.findIndex((step) => step === currentStepLabel)

    if (currentStep === -1) currentStep = 0

    // Helper to get the x offset for each step (overlap chevrons)
    const getStepOffset = (i) => i * (stepWidth - chevronWidth)

    // Generate polygons/paths for each step
    const renderStepShapes = () => {
        return Array.from({length: n}, (_, i) => {
            const x = getStepOffset(i)
            let path

            if (i === 0) {
                // First: rounded left, chevron right (chevron tip overlaps next step)
                path = `M ${x + radius},0
          L ${x + stepWidth - chevronWidth},0
          L ${x + stepWidth},${svgHeight / 2}
          L ${x + stepWidth - chevronWidth},${svgHeight}
          L ${x + radius},${svgHeight}
          A ${radius},${radius} 0 0 1 ${x},${svgHeight / 2}
          A ${radius},${radius} 0 0 1 ${x + radius},0
          Z`
            } else if (i === n - 1) {
                // Last: chevron left, rounded right (no chevron tip on right)
                path = `M ${x},0
          L ${x + stepWidth - radius},0
          A ${radius},${radius} 0 0 1 ${x + stepWidth},${svgHeight / 2}
          A ${radius},${radius} 0 0 1 ${x + stepWidth - radius},${svgHeight}
          L ${x},${svgHeight}
          L ${x + chevronWidth},${svgHeight / 2}
          Z`
            } else {
                // Middle: chevron left, chevron right (chevron tip overlaps next step)
                path = `M ${x},0
          L ${x + stepWidth - chevronWidth},0
          L ${x + stepWidth},${svgHeight / 2}
          L ${x + stepWidth - chevronWidth},${svgHeight}
          L ${x},${svgHeight}
          L ${x + chevronWidth},${svgHeight / 2}
          Z`
            }

            return (
                <path key={i} d={path} fill={getStepFillColor(i)} stroke="white" strokeWidth="2" />
            )
        })
    }

    // Overlay text for each step (shift overlays for overlap)
    const renderStepLabels = () => {
        const labels = []
        for (let i = 0; i < n; i++) {
            const x = getStepOffset(i)
            const stepStatus =
                i < currentStep ? 'completed' : i === currentStep ? 'current' : 'pending'
            const stepLabel = getLocalizedMessage(steps[i])

            labels.push(
                <Box
                    key={i}
                    position="absolute"
                    top={0}
                    left={`calc(${(x / svgWidth) * 100}% )`}
                    width={`calc(${(stepWidth / svgWidth) * 100}% )`}
                    height="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    px={[1, 2]} // Add horizontal padding for text
                    as="button"
                    tabIndex={0}
                    role="tab"
                    aria-selected={i === currentStep}
                    aria-label={`${stepLabel} - ${stepStatus}`}
                    aria-describedby={`step-description-${i}`}
                    _focus={{
                        outline: '2px solid',
                        outlineColor: 'blue.500',
                        outlineOffset: '2px'
                    }}
                    _hover={{
                        cursor: 'pointer'
                    }}
                >
                    <Text
                        color={getLabelColor(i)}
                        fontWeight="medium"
                        fontSize={['xs', 'sm', 'md', 'lg']}
                        textAlign="center"
                        lineHeight="1.2"
                        wordBreak="break-word"
                        hyphens="auto"
                        maxW="100%"
                        pointerEvents="none"
                    >
                        {stepLabel}
                    </Text>
                    <VisuallyHidden id={`step-description-${i}`}>
                        {stepStatus === 'completed' && 'This step has been completed'}
                        {stepStatus === 'current' && 'This is the current step'}
                        {stepStatus === 'pending' && 'This step is pending'}
                    </VisuallyHidden>
                </Box>
            )
        }
        return labels
    }

    return (
        <Box
            position="relative"
            width="100%"
            maxWidth="1080px"
            height="50px"
            role="tablist"
            aria-label="Order Status Steps"
            aria-describedby="order-status-description"
        >
            <svg
                width="100%"
                height="auto"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{display: 'block'}}
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                {renderStepShapes()}
            </svg>
            {renderStepLabels()}
            <VisuallyHidden id="order-status-description">
                Order status progress bar with {steps.length} steps. Currently on step{' '}
                {currentStep + 1}: {getLocalizedMessage(steps[currentStep])}. Use Tab to navigate
                between steps.
            </VisuallyHidden>
        </Box>
    )
}

OrderStatusBar.propTypes = {
    currentStepLabel: PropTypes.string
}

export default OrderStatusBar
