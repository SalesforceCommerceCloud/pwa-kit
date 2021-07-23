import React from 'react'
import ProductTile, {Skeleton} from './index'
import {renderWithProviders} from '../../utils/test-utils'

const mockProductSearchItem = {
    currency: 'USD',
    image: {
        alt: 'Charcoal Single Pleat Wool Suit, , large',
        disBaseLink:
            'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4de8166b/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg'
    },
    price: 299.99,
    productName: 'Charcoal Single Pleat Wool Suit'
}

test('Renders Breadcrumb', () => {
    const {getAllByRole} = renderWithProviders(
        <ProductTile productSearchItem={mockProductSearchItem} />
    )

    const link = getAllByRole('link')
    const img = getAllByRole('img')

    expect(link).toBeDefined()
    expect(img).toBeDefined()
})

test('Renders Skeleton', () => {
    const {getAllByTestId} = renderWithProviders(<Skeleton />)

    const skeleton = getAllByTestId('sf-product-tile-skeleton')

    expect(skeleton).toBeDefined()
})
