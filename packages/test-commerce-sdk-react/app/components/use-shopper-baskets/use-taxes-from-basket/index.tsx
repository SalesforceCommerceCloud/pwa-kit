import React, {ReactElement} from 'react'
import Json from '../../Json'
import {useTaxesFromBasket} from 'commerce-sdk-react'

export const UseTaxesFromBasket = ({basketId}: {basketId: string}): ReactElement => {
    const {isLoading, error, data} = useTaxesFromBasket({basketId}, {enabled: !!basketId})

    if (isLoading) {
        return (
            <div>
                <h1>Taxes: </h1>
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
                    <p>taxes:</p>
                    <ul>
                        {Object.keys(data?.taxes).map((taxItemId) => (
                            <li>{taxItemId}</li>
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
