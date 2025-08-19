/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box, Text, VisuallyHidden} from '@chakra-ui/react'
import PropTypes from 'prop-types'

/**
 * Reusable StatusBar component with SVG chevron design
 * @param {Object} props - Component props
 * @param {Array} props.steps - Array of step objects with {label, status, description}
 * @param {number} props.currentStep - Current active step index (0-based)
 * @param {Object} props.colors - Color scheme configuration
 * @param {string} props.colors.completed - Color for completed steps
 * @param {string} props.colors.current - Color for current step
 * @param {string} props.colors.future - Color for future steps
 * @param {string} props.colors.completedText - Text color for completed steps
 * @param {string} props.colors.currentText - Text color for current step
 * @param {string} props.colors.futureText - Text color for future steps
 * @param {boolean} props.showLabels - Whether to show step labels
 * @param {string} props.ariaLabel - ARIA label for accessibility
 * @param {number} props.width - Width of the status bar
 * @param {number} props.height - Height of the status bar
 * @param {number} props.chevronWidth - Width of each chevron
 * @param {number} props.radius - Border radius for rounded corners
 */
const StatusBar = ({
    steps,
    currentStep = 0,
    colors,
    showLabels = true,
    ariaLabel = 'Progress tracker',
    width,
    height,
    chevronWidth,
    radius
}) => {
    // Validate required props
    if (!steps || steps.length === 0) {
        return null
    }

    if (!colors) {
        return null
    }

    const totalOrderSteps = steps.length
    const stepWidth = (width + (totalOrderSteps - 1) * chevronWidth) / totalOrderSteps

    const getStepColor = (index) => {
        if (index < currentStep) return colors.completed
        if (index === currentStep) return colors.current
        return colors.future
    }

    const getTextColor = (index) => {
        if (index < currentStep) return colors.completedText
        if (index === currentStep) return colors.currentText
        return colors.futureText
    }

    const getStepStatus = (index) => {
        if (index < currentStep) return 'completed'
        if (index === currentStep) return 'current'
        return 'pending'
    }

    // Helper to get the x offset for each step (overlap chevrons)
    const getStepOffset = (i) => i * (stepWidth - chevronWidth)

    // Generate polygons/paths for each step
    const renderStepShapes = () => {
        return Array.from({length: totalOrderSteps}, (_, i) => {
            const x = getStepOffset(i)
            let path

            if (i === 0) {
                // First: rounded left, chevron right (chevron tip overlaps next step)
                path = `M ${x + radius},0
          L ${x + stepWidth - chevronWidth},0
          L ${x + stepWidth},${height / 2}
          L ${x + stepWidth - chevronWidth},${height}
          L ${x + radius},${height}
          A ${radius},${radius} 0 0 1 ${x},${height / 2}
          A ${radius},${radius} 0 0 1 ${x + radius},0
          Z`
            } else if (i === totalOrderSteps - 1) {
                // Last: chevron left, rounded right (no chevron tip on right)
                path = `M ${x},0
          L ${x + stepWidth - radius},0
          A ${radius},${radius} 0 0 1 ${x + stepWidth},${height / 2}
          A ${radius},${radius} 0 0 1 ${x + stepWidth - radius},${height}
          L ${x},${height}
          L ${x + chevronWidth},${height / 2}
          Z`
            } else {
                // Middle: chevron left, chevron right (chevron tip overlaps next step)
                path = `M ${x},0
          L ${x + stepWidth - chevronWidth},0
          L ${x + stepWidth},${height / 2}
          L ${x + stepWidth - chevronWidth},${height}
          L ${x},${height}
          L ${x + chevronWidth},${height / 2}
          Z`
            }

            return <path key={i} d={path} fill={getStepColor(i)} stroke="white" strokeWidth="2" />
        })
    }

    // Overlay text for each step (shift overlays for overlap)
    const renderStepLabels = () => {
        if (!showLabels) return null

        const labels = []
        for (let i = 0; i < totalOrderSteps; i++) {
            const x = getStepOffset(i)
            const stepStatus = getStepStatus(i)
            const stepLabel = steps[i]?.label || `Step ${i + 1}`

            labels.push(
                <Box
                    key={i}
                    position="absolute"
                    top={0}
                    left={`calc(${(x / width) * 100}% )`}
                    width={`calc(${(stepWidth / width) * 100}% )`}
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
                        color={getTextColor(i)}
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
            maxWidth={`${width}px`}
            height={`${height}px`}
            role="tablist"
            aria-label={ariaLabel}
            aria-describedby="status-bar-description"
        >
            <svg
                width="100%"
                height="auto"
                viewBox={`0 0 ${width} ${height}`}
                style={{display: 'block'}}
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                {renderStepShapes()}
            </svg>
            {renderStepLabels()}
            <VisuallyHidden id="status-bar-description">
                Progress bar with {steps.length} steps. Currently on step {currentStep + 1}:{' '}
                {steps[currentStep]?.label || `Step ${currentStep + 1}`}. Use Tab to navigate
                between steps.
            </VisuallyHidden>
        </Box>
    )
}

StatusBar.propTypes = {
    steps: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            status: PropTypes.string,
            description: PropTypes.string
        })
    ).isRequired,
    currentStep: PropTypes.number,
    colors: PropTypes.shape({
        completed: PropTypes.string,
        current: PropTypes.string,
        future: PropTypes.string,
        completedText: PropTypes.string,
        currentText: PropTypes.string,
        futureText: PropTypes.string
    }).isRequired,
    showLabels: PropTypes.bool,
    ariaLabel: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    chevronWidth: PropTypes.number,
    radius: PropTypes.number
}

export default StatusBar
