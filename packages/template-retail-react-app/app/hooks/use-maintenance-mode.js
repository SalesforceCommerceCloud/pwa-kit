/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useQuery} from '@tanstack/react-query'

const onClient = typeof window !== 'undefined'

const fetchMaintenanceMode = async () => {
    const res = await fetch('/mobify/maintenance/status')
    const data = await res?.json()
    return data
}
export const useMaintenanceMode = () => {
    const query = useQuery({
        queryKey: ['todos'],
        queryFn: fetchMaintenanceMode,
        enabled: onClient,
        refetchInterval: 10000
    })
    return query
}
