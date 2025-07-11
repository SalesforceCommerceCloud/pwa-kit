import React from "react";
import { Box, useTheme, Text } from "@chakra-ui/react";

// Simple square box component
export const SquareBox = () => {
  const theme = useTheme();
  return (
    <Box
      width="100px"
      height="100px"
      backgroundColor={theme.colors.blue[900]}
      borderRadius="8px"
    />
  );
};

// Notched box: left end bent inward at right angle
export const NotchedBox = () => {
  const theme = useTheme();
  const size = 100;
  const notch = 24;
  // Path: start at top-left, go right, down, left, up, but notch in left edge
  // Notch is a right-angled cut at the left edge, centered vertically
  const path = `
    M ${notch},0
    L ${size},0
    L ${size},${size}
    L ${notch},${size}
    L ${notch},${size / 2 + notch / 2}
    L 0,${size / 2}
    L ${notch},${size / 2 - notch / 2}
    Z
  `;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <path d={path} fill={theme.colors.blue[900]} />
    </svg>
  );
};

// Rounded left, chevron right step (matches your image)
export const RoundedChevronStep = ({
  width = 320,
  height = 64,
  chevronWidth = 24,
  radius = 32,
  text = "Ordered",
  fill = null,
  textColor = "white"
}) => {
  const theme = useTheme();
  const color = fill || theme.colors.blue[900];
  // SVG path: rounded left, chevron right
  const path = `
    M ${radius},0
    L ${width - chevronWidth},0
    L ${width},${height / 2}
    L ${width - chevronWidth},${height}
    L ${radius},${height}
    A ${radius},${radius} 0 0 1 0,${height / 2}
    A ${radius},${radius} 0 0 1 ${radius},0
    Z
  `;
  return (
    <Box position="relative" width={`${width}px`} height={`${height}px`}>
      <svg width={width} height={height} style={{ display: "block" }}>
        <path d={path} fill={color} />
      </svg>
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <Text color={textColor} fontWeight="medium" fontSize="xl">
          {text}
        </Text>
      </Box>
    </Box>
  );
};

// Chevron right, chevron right step (parallelogram slants forward)
export const DoubleChevronStep = ({
  width = 320,
  height = 64,
  chevronWidth = 24,
  text = "Step",
  fill = null,
  textColor = null
}) => {
  const theme = useTheme();
  const color = fill || theme.colors.gray[200];
  const tColor = textColor || theme.colors.blue[900];
  // Parallelogram slants forward: left edge is a right chevron
  const path = `
    M 0,0
    L ${width - chevronWidth},0
    L ${width},${height / 2}
    L ${width - chevronWidth},${height}
    L 0,${height}
    L ${chevronWidth},${height / 2}
    Z
  `;
  return (
    <Box position="relative" width={`${width}px`} height={`${height}px`}>
      <svg width={width} height={height} style={{ display: "block" }}>
        <path d={path} fill={color} />
      </svg>
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <Text color={tColor} fontWeight="medium" fontSize="xl">
          {text}
        </Text>
      </Box>
    </Box>
  );
};

// Chevron right, rounded right step
export const ChevronRoundedEndStep = ({
  width = 320,
  height = 64,
  chevronWidth = 24,
  radius = 32,
  text = "Step",
  fill = null,
  textColor = null
}) => {
  const theme = useTheme();
  const color = fill || theme.colors.gray[200];
  const tColor = textColor || theme.colors.blue[900];
  // Left edge is a right chevron, right edge is rounded
  const path = `
    M 0,0
    L ${width - radius},0
    A ${radius},${radius} 0 0 1 ${width},${height / 2}
    A ${radius},${radius} 0 0 1 ${width - radius},${height}
    L 0,${height}
    L ${chevronWidth},${height / 2}
    Z
  `;
  return (
    <Box position="relative" width={`${width}px`} height={`${height}px`}>
      <svg width={width} height={height} style={{ display: "block" }}>
        <path d={path} fill={color} />
      </svg>
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <Text color={tColor} fontWeight="medium" fontSize="xl">
          {text}
        </Text>
      </Box>
    </Box>
  );
};

const steps = [
  "Ordered",
  "Dispatched",
  "Out for delivery",
  "Delivered"
];

const ProgressTracker = () => {
  const theme = useTheme();
  // Layout constants
  const n = steps.length;
  const width = 320;
  const height = 64;
  const chevronWidth = 24;
  const radius = 32;

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
        fill = theme.colors.blue[900];
      } else if (i === n - 1) {
        // Last: chevron left, rounded right (no chevron tip on right)
        path = `M ${x},0
          L ${x + width - radius},0
          A ${radius},${radius} 0 0 1 ${x + width},${height / 2}
          A ${radius},${radius} 0 0 1 ${x + width - radius},${height}
          L ${x},${height}
          L ${x + chevronWidth},${height / 2}
          Z`;
        fill = theme.colors.gray[200];
      } else {
        // Middle: chevron left, chevron right (chevron tip overlaps next step)
        path = `M ${x},0
          L ${x + width - chevronWidth},0
          L ${x + width},${height / 2}
          L ${x + width - chevronWidth},${height}
          L ${x},${height}
          L ${x + chevronWidth},${height / 2}
          Z`;
        fill = theme.colors.gray[200];
      }
      shapes.push(
        <path key={i} d={path} fill={fill} />
      );
    }
    return shapes;
  };

  // Overlay text for each step (shift overlays for overlap)
  const renderStepLabels = () => {
    const labels = [];
    for (let i = 0; i < n; i++) {
      const x = getStepOffset(i);
      const labelColor = i === 0 ? "white" : theme.colors.blue[900];
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
