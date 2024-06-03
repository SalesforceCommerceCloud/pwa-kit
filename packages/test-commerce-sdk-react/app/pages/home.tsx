/*
 * Copyright (c) 2022, salesforce.com, inc.
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
                demonstrate the feature.
            </p>
            <p>Happy coding.</p>

            <h2>Hooks</h2>
            <ul>
                <li>
                    <Link to="/products">useShopperProducts</Link>
                </li>
                <li>
                    <Link to="/experience">useShopperExperience</Link>
                </li>
                <li>
                    <Link to="/categories">useCategories</Link>
                </li>
                <li>
                    <Link to="/search">useProductSearch</Link>
                </li>
                <li>
                    <Link to="/search-suggestions">useSearchSuggestions</Link>
                </li>
                <li>
                    <Link to="/use-promotions">usePromotions</Link>
                </li>
                <li>
                    <Link to="/use-promotions-for-campaign">usePromotionsForCampaign</Link>
                </li>
                <li>
                    <Link to="/customer">useCustomer & useShopperCustomersMutation</Link>
                </li>
                <li>
                    <Link to="/slas-helpers">useAuthHelper</Link>
                </li>
                <li>
                    <Link to="/basket">useBasket & useShopperBasketsMutation</Link>
                </li>
                <li>
                    <Link to="/orders">useShopperOrders & useShopperOrdersMutation</Link>
                </li>
                <li>
                    <Link to="/context">useShopperContext & useShopperContextsMutation</Link>
                </li>
                <li>
                    <Link to="/stores">useShopperStores</Link>
                </li>
            </ul>

            <h2>Miscellaneous</h2>
            <ul>
                <li>
                    <Link to="/query-errors">Query errors</Link>
                </li>
                <li>
                    <Link to="/customerId">useCustomerId</Link>
                </li>
                <li>
                    <Link to="/custom-endpoint">useCustomQuery</Link>
                </li>
            </ul>
        </>
    )
}

Home.getTemplateName = () => 'home'

export default Home
