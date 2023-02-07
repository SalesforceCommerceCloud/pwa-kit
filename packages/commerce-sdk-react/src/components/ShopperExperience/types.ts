/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ApiClients, DataType} from '../../hooks/types' // TODO: Should we be moving these types to a more global place.

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number]

type Client = ApiClients['shopperExperience']

export type Page = DataType<Client['getPage']>

export type Region = ArrayElement<NonNullable<Page['regions']>>

export type Component = ArrayElement<NonNullable<Region['components']>>
