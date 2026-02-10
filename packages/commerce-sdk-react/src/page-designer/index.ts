/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Page Designer Integration Module
 *
 * This module provides components, hooks, and utilities for integrating
 * Salesforce Page Designer with React applications. Import from this
 * subpath only if you're using Page Designer features.
 *
 * @example
 * ```typescript
 * // Import Page Designer features
 * import {
 *   PageDesignerProvider,
 *   usePageDesignerMode,
 *   Page,
 *   usePages
 * } from '@salesforce/commerce-sdk-react/page-designer'
 * ```
 *
 * @module page-designer
 */

// Re-export ShopperExperience components (Page Designer rendering)
export * from '../components/ShopperExperienceV2'

// Re-export Page Designer hooks
export {useGlobalAnchorBlock} from '../hooks/useGlobalAnchorBlock'

// Re-export the registry for component registration
export {registry} from '../components/ShopperExperienceV2'
