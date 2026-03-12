/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {CLIENT_KEYS} from '../../constant'
import {ApiClients, DataType} from '../../hooks/types' // TODO: Should we be moving these types to a more global place.
import type {ShopperExperience} from '@salesforce/storefront-next-runtime/scapi'
import type {ComponentDecoratorProps} from '@salesforce/storefront-next-runtime/design/react'
import {PageDesignMetadata} from './Region'

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number]

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_EXPERIENCE
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

export type Page = DataType<Client['getPage']>

export type Region = ArrayElement<NonNullable<Page['regions']>>

export type Component = ArrayElement<NonNullable<Region['components']>>

/**
 * Extended Page type with design metadata and component data
 *
 * Uses the base Page type and adds optional component data map for async component data loading.
 * This type is more flexible and compatible with both SDK-generated Page types and
 * ShopperExperience.schemas['Page'].
 */
export type PageDecoratorProps<TProps> = React.PropsWithChildren<
    {
        designMetadata?: PageDesignMetadata
    } & TProps
>

// Extended Page type with design metadata
export type PageWithDesignMetadata = PageDecoratorProps<ShopperExperience.schemas['Page']> & {
    componentData?: Record<string, Promise<unknown>>
}

/**
 * Component type with design decorator props
 *
 * Includes decorator props for Page Designer design mode on components.
 */
export type ComponentType = ComponentDecoratorProps<ShopperExperience.schemas['Component']>
