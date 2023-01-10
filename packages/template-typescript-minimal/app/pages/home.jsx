/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useSearchSuggestion} from '../hooks/useFetch'
import useDebounce from '../hooks/useDebounce'
import {useHistory} from 'react-router-dom'

const Home = () => {
    const [searchTerm, setSearchTerm] = React.useState('')
    const history = useHistory()
    const debouncedSearch = useDebounce(searchTerm, 500)
    const {data} = useSearchSuggestion(debouncedSearch)
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
                        placeholder="Search product, category... e.g coffee, energy drink"
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
