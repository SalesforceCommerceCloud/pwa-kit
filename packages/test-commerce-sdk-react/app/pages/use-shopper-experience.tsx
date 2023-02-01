/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {usePages} from 'commerce-sdk-react-preview'
import Json from '../components/Json'
import {Link} from 'react-router-dom'
const ids = 'homepage-example,campaign-example'

const UseShopperExperience = () => {
    const {
        isLoading,
        error,
        data: result
    } = usePages({
        ids,
        aspectTypeId: 'pdp'
    })
    if (isLoading) {
        return (
            <div>
                <h1>Pages</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>Pages</h1>
            <div>Click on the link to go to a individual page</div>
            {result?.data.map(({id, name}) => {
                return (
                    <div key={id}>
                        <Link to={`/pages/${id}`}>{name}</Link>
                    </div>
                )
            })}
            <hr />
            <div>
                <div>Returning data</div>
                <Json data={{isLoading, error, result}} />
            </div>
        </>
    )
}

UseShopperExperience.getTemplateName = () => 'UseShopperExperience'

export default UseShopperExperience
