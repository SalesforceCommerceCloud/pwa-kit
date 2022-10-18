import React, {ReactElement} from 'react'
import Json from '../../Json'
import {useShippingMethodsForShipment} from 'commerce-sdk-react'

export const UseShippingMethodsForShipment = ({
    basketId,
    shipmentId,
}: {
    basketId: string
    shipmentId: string
}): ReactElement => {
    const {isLoading, error, data} = useShippingMethodsForShipment(
        {basketId, shipmentId},
        {enabled: !!basketId}
    )

    if (isLoading) {
        return (
            <div>
                <h1>Shipping Methods: </h1>
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
                    <p>shipping methods:</p>
                    <ul>
                        {data?.applicableShippingMethods?.map((shippingMethod) => (
                            <li>{shippingMethod.name}</li>
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
