import React from 'react'
import {useBasket} from 'commerce-sdk-react'
import Json from '../../../components/Json'
import {Link} from 'react-router-dom'

const basketId = '123'

function UseBasket() {
    const {isLoading, error, data: result} = useBasket({
        parameters: {
            basketId
        }
    })

    if (isLoading) {
        return (
            <div>
                <h1>Search Results</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            <h1>Basket</h1>
            {result?.productItems?.map(({productId, productName}) => {
                return (
                    <div key={productId}>
                        <Link to={`/products/${productId}`}>{productName}</Link>
                    </div>
                )
            })}
            <p>Total: {result?.productTotal} {result.currency}</p>
            <hr />
            <div>
                <div>Returning data</div>
                <Json data={{isLoading, error, result}} />
            </div>
        </>
    )
}

export default UseBasket