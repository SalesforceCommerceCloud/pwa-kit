import React, {ReactElement} from 'react'
import Json from '../../Json'
import {usePaymentMethodsForBasket} from 'commerce-sdk-react'

export const UsePaymentMethodsForBasket = ({basketId}: {basketId: string}): ReactElement => {
    const {isLoading, error, data} = usePaymentMethodsForBasket({basketId}, {enabled: !!basketId})

    if (isLoading) {
        return (
            <div>
                <h1>Payment Methods</h1>
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
                    <p>payment methods:</p>
                    <ul>
                        {data?.applicablePaymentMethods?.map((paymentMethod) => (
                            <li>
                                {paymentMethod.id} | {paymentMethod.name} |{' '}
                                {paymentMethod.description}
                            </li>
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
