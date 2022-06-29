/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import SiteLayout from '../site-layout'

export const getLayout = (page) => {
    return <SiteLayout title="SiteLayout Home">{page}</SiteLayout>
}
