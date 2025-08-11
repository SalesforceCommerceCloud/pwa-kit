/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Suspense, lazy} from 'react'
import {Skeleton, Box, Stack} from '@chakra-ui/react'

// Performance optimization: Lazy load heavy components that are not immediately visible
// This reduces initial bundle size and improves TBT by deferring non-critical JS

// Heavy components that can be lazy loaded
export const LazyProductScroller = lazy(() => import('./product-scroller'))
export const LazyRecommendedProducts = lazy(() => import('./recommended-products'))

// Loading fallbacks optimized for each component type
export const ProductScrollerSkeleton = () => (
    <Stack gap={6} p={4}>
        <Skeleton height={6} width="150px" mx="auto" />
        <Stack direction="row" gap={4} overflowX="hidden">
            {[0, 1, 2, 3].map((key) => (
                <Box key={key} minW={{base: '70%', md: '40%', lg: 'calc(33.33% - 10px)'}}>
                    <Skeleton aspectRatio={0.75} borderRadius="md" />
                    <Stack gap={2} mt={2}>
                        <Skeleton height={4} width="80%" />
                        <Skeleton height={3} width="60%" />
                    </Stack>
                </Box>
            ))}
        </Stack>
    </Stack>
)

export const RecommendedProductsSkeleton = () => (
    <Stack gap={4} p={4}>
        <Skeleton height={6} width="200px" mx="auto" />
        <Stack direction="row" gap={4} overflowX="hidden">
            {[0, 1, 2].map((key) => (
                <Box key={key} minW={{base: '80%', md: '50%', lg: '33%'}}>
                    <Skeleton aspectRatio={1} borderRadius="md" />
                    <Stack gap={2} mt={2}>
                        <Skeleton height={4} width="90%" />
                        <Skeleton height={3} width="70%" />
                    </Stack>
                </Box>
            ))}
        </Stack>
    </Stack>
)

// HOC for lazy loading with custom fallback
export const withLazyLoading = (LazyComponent, LoadingSkeleton) => {
    const WrappedComponent = (props) => (
        <Suspense fallback={<LoadingSkeleton />}>
            <LazyComponent {...props} />
        </Suspense>
    )
    
    WrappedComponent.displayName = `withLazyLoading(${LazyComponent.displayName || LazyComponent.name})`
    
    return WrappedComponent
}

// Pre-configured lazy components with appropriate skeletons
export const LazyProductScrollerWithSkeleton = withLazyLoading(LazyProductScroller, ProductScrollerSkeleton)
export const LazyRecommendedProductsWithSkeleton = withLazyLoading(LazyRecommendedProducts, RecommendedProductsSkeleton)