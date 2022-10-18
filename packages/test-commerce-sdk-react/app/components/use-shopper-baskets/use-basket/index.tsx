import React, {ReactElement} from 'react'
import Json from '../../Json'
import {useBasket} from 'commerce-sdk-react'

export const UseBasket = ({basketId}: {basketId: string}): ReactElement => {
    const {isLoading, error, data} = useBasket({basketId}, {enabled: !!basketId})

    if (isLoading) {
        return (
            <div>
                <h1>Basket</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            {data && (
                <>
                    <div>customerId: {data?.customerInfo?.customerId}</div>
                    <p>currency: {data?.currency}</p>
                    <p>product total: {data?.productTotal}</p>
                    <ul>
                        {data?.productItems?.map((productItem) => (
                            <li>{productItem.itemText}</li>
                        ))}
                    </ul>
                    <hr />
                    <div>
                        <div>Returning data</div>
                        <Json data={{isLoading, error, data}} />
                    </div>
                </>
            )}
        </>
    )
}
