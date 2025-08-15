import type { ReactElement } from 'react';
import { data, type LoaderFunctionArgs } from 'react-router';
import type { ShopperBasketsTypes } from 'commerce-sdk-isomorphic';
import { getCommerceApiToken } from '@/utils/api/commerce-api';
import { createShopperBasketsClient } from '@/utils/api/commerce-client';

export async function loader({
    request
}: LoaderFunctionArgs): Promise<ShopperBasketsTypes.Basket> {
    const [session, commitSession, status] = await getCommerceApiToken(request);
    const client = createShopperBasketsClient(session.data);
    const { basketId } = session.data;

    /**
     * Utility to merge the retrieved basket's ID into the existing session information, if required.
     */
    const respond = async (
        basket: ShopperBasketsTypes.Basket,
        update = true
    ): Promise<ShopperBasketsTypes.Basket> => {
        return data(
            { basket },
            {
                ...(update
                    ? {
                          headers: {
                              'Set-Cookie': await commitSession({
                                  ...session,
                                  data: {
                                      ...session.data,
                                      basketId: basket.basketId
                                  }
                              })
                          }
                      }
                    : {})
            }
        );
    };

    if (basketId) {
        // Retrieve existing basket
        // TODO: wrap inside a `fetchBasket` helper
        // TODO: add error handling (e.g. basket re-creation in case of failures, etc.)
        const basket = await client.getBasket({
            parameters: {
                basketId
            }
        });
        return respond(basket, status === 'new' || status === 'refreshed');
    }

    // Create new basket
    try {
        const basket = await client.createBasket({
            body: {}
        });
        return respond(basket);
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            Reflect.has(error, 'response')
        ) {
            const response = (
                Reflect.get(error, 'response') as Response
            ).clone();
            const reason = await response.json();
            if (
                typeof reason === 'object' &&
                reason !== null &&
                Reflect.get(reason, 'type') ===
                    'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/customer-baskets-quota-exceeded'
            ) {
                const basketIds = Reflect.get(reason, 'basketIds');
                const id = (
                    Array.isArray(basketIds)
                        ? basketIds
                        : [String(basketIds as string)]
                ).at(0) as string;
                const basket = await client.getBasket({
                    parameters: {
                        basketId: id
                    }
                });
                return respond(basket);
            }
        }
        throw error;
    }
}

export default function Cart(): ReactElement {
    return <>Cart</>;
}
