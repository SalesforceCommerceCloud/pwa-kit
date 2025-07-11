import React from "react";
import { Box, useTheme, Text } from "@chakra-ui/react";

const steps = [
  "Ordered",
  "Dispatched",
  "Out for delivery",
  "Delivered"
];

const ProgressTracker = ({ currentStepLabel }) => {
  const theme = useTheme();
  // Layout constants
  const n = steps.length;
  const width = 320;
  const height = 64;
  const chevronWidth = 24;
  const radius = 32;

  // Find the index of the current step label (case-insensitive, trim whitespace)
  let currentStep = steps.indexOf(currentStepLabel);
  if (currentStep === -1) currentStep = 0;

  // Calculate total SVG width (overlap chevrons)
  const svgWidth = width + (n - 1) * (width - chevronWidth);
  const svgHeight = height;

  // Helper to get the x offset for each step (overlap chevrons)
  const getStepOffset = (i) => i * (width - chevronWidth);

  // Generate polygons/paths for each step
  const renderStepShapes = () => {
    const shapes = [];
    for (let i = 0; i < n; i++) {
      const x = getStepOffset(i);
      let path, fill;
      if (i === 0) {
        // First: rounded left, chevron right (chevron tip overlaps next step)
        path = `M ${x + radius},0
          L ${x + width - chevronWidth},0
          L ${x + width},${height / 2}
          L ${x + width - chevronWidth},${height}
          L ${x + radius},${height}
          A ${radius},${radius} 0 0 1 ${x},${height / 2}
          A ${radius},${radius} 0 0 1 ${x + radius},0
          Z`;
      } else if (i === n - 1) {
        // Last: chevron left, rounded right (no chevron tip on right)
        path = `M ${x},0
          L ${x + width - radius},0
          A ${radius},${radius} 0 0 1 ${x + width},${height / 2}
          A ${radius},${radius} 0 0 1 ${x + width - radius},${height}
          L ${x},${height}
          L ${x + chevronWidth},${height / 2}
          Z`;
      } else {
        // Middle: chevron left, chevron right (chevron tip overlaps next step)
        path = `M ${x},0
          L ${x + width - chevronWidth},0
          L ${x + width},${height / 2}
          L ${x + width - chevronWidth},${height}
          L ${x},${height}
          L ${x + chevronWidth},${height / 2}
          Z`;
      }
      fill = i <= currentStep ? theme.colors.blue[900] : theme.colors.gray[200];
      shapes.push(
        <path key={i} d={path} fill={fill} stroke="white" strokeWidth="2" />
      );
    }
    return shapes;
  };

  // Overlay text for each step (shift overlays for overlap)
  const renderStepLabels = () => {
    const labels = [];
    for (let i = 0; i < n; i++) {
      const x = getStepOffset(i);
      const labelColor = i <= currentStep ? "white" : theme.colors.blue[900];
      labels.push(
        <Box
          key={i}
          position="absolute"
          top={0}
          left={`${x}px`}
          width={`${width}px`}
          height={`${height}px`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Text color={labelColor} fontWeight="medium" fontSize="xl">
            {steps[i]}
          </Text>
        </Box>
      );
    }
    return labels;
  };

  return (
    <Box position="relative" width={`${svgWidth}px`} height={`${svgHeight}px`}>
      <svg width={svgWidth} height={svgHeight} style={{ display: "block" }}>
        {renderStepShapes()}
      </svg>
      {renderStepLabels()}
    </Box>
  );
};

export default ProgressTracker;
