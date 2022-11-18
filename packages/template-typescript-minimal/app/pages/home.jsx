/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {useCategories, useProductCategoryPath} from '../hooks/useFetch'
import {useQuery} from '@tanstack/react-query'
import {Link} from 'react-router-dom'

const Home = () => {
    return <div>Home</div>
}

Home.getTemplateName = () => 'home'

export default Home
