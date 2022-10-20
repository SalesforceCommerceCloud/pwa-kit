/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {ReactElement} from 'react'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {screen, waitFor} from '@testing-library/react'
import {usePromotions, usePromotionsForCampaign} from './query'
import path from 'path'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const PromotionsComponent = ({ids}: {ids: string}): ReactElement => {
    const {data, isLoading, error} = usePromotions({
        ids
    })

    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {error && <span>error</span>}
            {data && <div>Total: {data.total}</div>}
            {data && (
                <div>
                    {data.data?.map(({name}, i) => (
                        <div key={i}>{name}</div>
                    ))}
                </div>
            )}
        </div>
    )
}

const PromotionsForCampaignComponent = ({campaignId}: {campaignId: string}): ReactElement => {
    const {data, isLoading, error} = usePromotionsForCampaign({
        campaignId
    })
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {error && <span>error</span>}
            {data && <div>Total: {data.total}</div>}
            {data && (
                <div>
                    {data.data?.map(({name}, i) => (
                        <div key={i}>{name}</div>
                    ))}
                </div>
            )}
        </div>
    )
}

const tests = [
    {
        hook: 'usePromotions',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const ids = '10offsuits,50%offorder'
                    renderWithProviders(<PromotionsComponent ids={ids} />)
                    const promotionNames = ["10% off men's suits", '50% off order']
                    expect(screen.queryByText(promotionNames[0])).toBeNull()
                    expect(screen.queryByText(promotionNames[1])).toBeNull()
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(promotionNames[0]))

                    expect(screen.queryByText(promotionNames[0])).toBeInTheDocument()
                    expect(screen.queryByText(promotionNames[1])).toBeInTheDocument()
                    expect(screen.getByText(`Total: ${promotionNames.length}`)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    // Maximum characters is 256, generating 51 ids here will exceed that limit
                    // and cause the server to return an error
                    const fakeIds = [...new Array(51)]
                        .map((i) => `promo_${Math.floor(Math.random() * 50)}`)
                        .join(',')
                    renderWithProviders(<PromotionsComponent ids={fakeIds} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    },
    {
        hook: 'usePromotionsForCampaign',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const ids = '10offsuits,50%offorder'
                    renderWithProviders(
                        <PromotionsForCampaignComponent campaignId="promotion-campaign" />
                    )
                    const promotionNames = [
                        '50% off Shipping Amount Above 100',
                        "10% off men's suits",
                        '50% off order'
                    ]
                    expect(screen.queryByText(promotionNames[0])).toBeNull()
                    expect(screen.queryByText(promotionNames[1])).toBeNull()
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(promotionNames[0]))

                    expect(screen.queryByText(promotionNames[0])).toBeInTheDocument()
                    expect(screen.queryByText(promotionNames[1])).toBeInTheDocument()
                    expect(screen.getByText(`Total: ${promotionNames.length}`)).toBeInTheDocument()
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    // passing invalid string exceeded 356 char should cause the server to return an error
                    const invalidId = [...new Array(51)]
                        .map((i) => `promo_${Math.floor(Math.random() * 50)}`)
                        .join('_')
                    renderWithProviders(<PromotionsForCampaignComponent campaignId={invalidId} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        afterEach(() => {
            jest.resetAllMocks()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
