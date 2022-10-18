import React, {ReactElement} from 'react'
import Json from '../../Json'
import {useBasket} from 'commerce-sdk-react'

export const UseBasket = ({basketId}: {basketId: string}): ReactElement | null => {
    const {isLoading, error, data} = useBasket({basketId}, {enabled: !!basketId})

    if (!basketId) {
        return null
    }

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
                    <h2>useBasket</h2>
                    <Json data={{isLoading, error, data}} />
                </>
            )}
        </>
    )
}
