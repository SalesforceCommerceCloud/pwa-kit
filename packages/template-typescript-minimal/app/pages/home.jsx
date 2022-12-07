/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {useCategories, useProductCategoryPath, useSearchSuggestion} from '../hooks/useFetch'
import {debounce} from '../utils/utils'
import useDebounce from '../hooks/useDebounce'
import {useHistory} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import fetch from 'cross-fetch'
import LoginInfo from '../../config/user-config'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

const Home = () => {
    const [searchTerm, setSearchTerm] = React.useState('')
    const history = useHistory()
    const debouncedSearch = useDebounce(searchTerm, 500)
    const {data, isLoading} = useSearchSuggestion(debouncedSearch)
    const query = useQuery(['example-data'], async () => {
        const response = await fetch(`${getAppOrigin()}/mobify/proxy/scom/services/Soap/c/56.0`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                SOAPAction: 'login'
            },
            body: `<?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope
                xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:xsd="http://www.w3.org/2001/XMLSchema">
                    <soap:Header>
                        <LoginScopeHeader xmlns="urn:enterprise.soap.sforce.com">
                            <organizationId>00DRO000000BH4w</organizationId>
                        </LoginScopeHeader>
                    </soap:Header>
                    <soap:Body>
                        <login xmlns="urn:enterprise.soap.sforce.com">
                            <username>${LoginInfo.username}</username>
                            <password>${LoginInfo.password}</password>
                        </login>
                    </soap:Body>
                </soap:Envelope>`
        })
        const body = await response.text()
        const token = /<sessionId>(.*)<\/sessionId>/.exec(body)[1]
        return token
    })
    console.log('query', query.data)
    return (
        <div>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    history.push(`/search?q=${encodeURI(searchTerm)}`)
                }}
            >
                <label>
                    <input
                        style={{width: '500px'}}
                        type="text"
                        value={searchTerm}
                        placeholder="Search product, category... etc coffee, energy drink"
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                        }}
                    />
                </label>
                <input type="submit" value="Submit" />
            </form>
            <div>{data?.recentSearchSuggestions.length === 0 ? 'No suggestions' : ''}</div>
        </div>
    )
}

Home.getTemplateName = () => 'home'

export default Home
