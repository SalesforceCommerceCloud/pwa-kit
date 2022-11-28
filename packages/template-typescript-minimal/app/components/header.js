/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useAuth} from '../hooks/useAuth'
import {Link} from 'react-router-dom'
import {
    getApiUrl,
    useCart,
    useCartAction,
    useCategories,
    useSessionContext
} from '../hooks/useFetch'

Header.propTypes = {}
const Category = ({cate}) => {
    const {fields} = cate
    const {data, isLoading} = useCategories(fields.Id)
    if (isLoading) return <div>Loading...</div>
    return (
        <div>
            <Link to={`/category/${fields.Id}/${fields.Name.toLowerCase()}`}>
                Category {fields.Name}
            </Link>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                data?.productCategories && (
                    <ul>
                        {data?.productCategories?.map((cat) => (
                            <li key={cat.fields.Id}>
                                <Link
                                    to={`/category/${
                                        cat.fields.Id
                                    }/${cat.fields.Name.toLowerCase()}`}
                                >
                                    {cat.fields.Name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )
            )}
        </div>
    )
}
function Header() {
    const {token} = useAuth()
    const {data: cart} = useCart(
        'current',
        {},
        {
            onError: (err) => {
                if (err.message === 'Invalid webstoreId or no current cart exists') {
                    cartAction.mutate({
                        url: getApiUrl(`/carts`),
                        payload: {
                            name: 'Cart',
                            type: 'Cart'
                        },
                        fetchOptions: {
                            method: 'POST'
                        }
                    })
                }
            }
        }
    )
    const {data, isLoading, error} = useCategories()
    const {data: sessionContext} = useSessionContext()
    const cartAction = useCartAction()
    React.useEffect(() => {
        if (cart?.[0]?.errorCode === 'INVALID_ID_FIELD') {
            cartAction.mutate({
                url: getApiUrl(`/carts`),
                payload: {
                    name: 'Cart',
                    type: 'Cart'
                },
                fetchOptions: {
                    method: 'POST'
                }
            })
        }
    }, [cart])
    if (isLoading) {
        return <div>Loading categories.....</div>
    }

    if (error) {
        return <h2 style={{color: 'red'}}>Something is wrong</h2>
    }
    return (
        <div>
            <div>
                {token ? <h2>Logged in as alex.vuong </h2> : <h2>Logging in as alex.vuong</h2>}
            </div>
            <div>
                {sessionContext?.guestUser ? (
                    ''
                ) : (
                    <>
                        <Link to={'/orders'}>Orders</Link> <br />
                        <Link to={'/addresses'}>Addresses</Link> <br />
                        <Link to={'/wishlist'}>Wishlist</Link>
                    </>
                )}
            </div>
            <hr />
            <Link to={'/'}>Home</Link>
            <div>
                <div>
                    {data?.productCategories?.map((cate) => {
                        return <Category key={cate.id} cate={cate} />
                    })}
                </div>
            </div>

            <Link to={'/cart'}>
                Cart {parseInt(cart?.totalProductCount) > 0 ? `(${cart?.totalProductCount})` : null}
            </Link>
            <hr />
        </div>
    )
}

export default Header
