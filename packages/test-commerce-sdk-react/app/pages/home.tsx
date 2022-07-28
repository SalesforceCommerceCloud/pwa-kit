/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Link} from 'react-router-dom'

const Home = () => {
    return (
        <>
            <h1>👋 Welcome!</h1>
            <p>This is a test playground for commerce-sdk-react.</p>
            <p>Feel free to use this playground to develop commerce-sdk-react.</p>
            <p>
                If you are adding new features to the package, please add a new page on this app to
                demostrate the feature.
            </p>
            <p>Happy coding.</p>
            <h2>Hooks</h2>
            <Link to="/products">useShopperProducts</Link>
            <br />
            <Link to="/categories">useCategories</Link>
        </>
    )
}

Home.getTemplateName = () => 'home'

export default Home
