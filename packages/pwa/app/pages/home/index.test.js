import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import HomePage from './index'

const sampleRecommendedProductHits = [
    {
        currency: 'USD',
        hitType: 'master',
        image: {
            alt: 'Button Front Crew Neck Cardigan, , large',
            disBaseLink:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7f51b7c3/images/large/PG.10217025.JJ1MCE6.PZ.jpg',
            link:
                'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7f51b7c3/images/large/PG.10217025.JJ1MCE6.PZ.jpg',
            title: 'Button Front Crew Neck Cardigan, '
        },
        orderable: true,
        price: 46.99,
        productId: '25518174M',
        productName: 'Button Front Crew Neck Cardigan',
        productType: {master: true},
        representedProduct: {id: '701642834489M'},
        representedProducts: [
            {id: '701642834489M'},
            {id: '701642834441M'},
            {id: '701642834472M'},
            {id: '701642834465M'},
            {id: '701642834496M'},
            {id: '701642834458M'},
            {id: '701642834519M'},
            {id: '701642834502M'}
        ],
        variationAttributes: [
            {
                id: 'color',
                name: 'Color',
                values: [
                    {name: 'Grey Heather Multi', orderable: true, value: 'JJ1MCE6'},
                    {name: 'Begonia Multi', orderable: true, value: 'JJHL3XX'}
                ]
            },
            {
                id: 'size',
                name: 'Size',
                values: [
                    {name: 'S', orderable: true, value: '9SM'},
                    {name: 'M', orderable: true, value: '9MD'},
                    {name: 'L', orderable: true, value: '9LG'},
                    {name: 'XL', orderable: true, value: '9XL'}
                ]
            }
        ]
    }
]

test('Home Page renders without errors', () => {
    const {getByTestId, getByText} = renderWithProviders(
        <HomePage productSearchResult={{hits: sampleRecommendedProductHits}} />
    )

    expect(getByTestId('home-page')).toBeInTheDocument()
    expect(getByText(sampleRecommendedProductHits[0].productName)).toBeInTheDocument()
    expect(typeof HomePage.getTemplateName()).toEqual('string')
})
