/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {createMemoryHistory} from 'history'
import {Router, useHistory, useLocation} from 'react-router-dom'
import {screen, fireEvent, waitFor} from '@testing-library/react'

import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group/index'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const arrowLeft = {key: 'ArrowLeft', code: 'ArrowRight', charCode: 37}
const arrowUp = {key: 'ArrowUp', code: 'ArrowRight', charCode: 38}
const arrowRight = {key: 'ArrowRight', code: 'ArrowRight', charCode: 39}
const arrowDown = {key: 'ArrowDown', code: 'ArrowDown', charCode: 40}

const data = {
    id: 'color',
    name: 'Color',
    values: [
        {
            name: 'Black',
            orderable: false,
            value: 'BLACKFB',
            href: '/en-GB/swatch-example?color=BLACKFB',
            image: {
                alt: 'Navy Single Pleat Wool Suit, Navy, swatch',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad8e7f28/images/swatch/PG.52002RUBN4Q.NAVYWL.CP.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad8e7f28/images/swatch/PG.52002RUBN4Q.NAVYWL.CP.jpg',
                title: 'Navy Single Pleat Wool Suit, Navy'
            }
        },
        {
            name: 'Grey Heather',
            orderable: true,
            value: 'JJ2XNXX',
            href: '/en-GB/swatch-example?color=JJ2XNXX',
            image: {
                alt: 'Long Sleeve Crew Neck, Grey Heather, swatch',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3238595c/images/swatch/PG.10219685.JJ2XNXX.CP.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3238595c/images/swatch/PG.10219685.JJ2XNXX.CP.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            }
        },
        {
            name: 'Meadow Violet',
            orderable: true,
            value: 'JJ3HDXX',
            href: '/en-GB/swatch-example?color=JJ3HDXX',
            image: {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, swatch',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7b40c85a/images/swatch/PG.10219685.JJ3HDXX.CP.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7b40c85a/images/swatch/PG.10219685.JJ3HDXX.CP.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            }
        }
    ]
}

const Page = () => {
    const location = useLocation()
    const history = useHistory()
    const params = new URLSearchParams(location.search)
    const selectedColor = data.values.find(({value}) => {
        return value === params.get('color')
    })

    return (
        <SwatchGroup
            variant="circle"
            key={data.id}
            value={params.get('color')}
            displayName={(selectedColor && selectedColor.name) || ''}
            label={data.name}
            name={data.name}
            onChange={(_, href) => {
                if (!href) return
                history.replace(href)
            }}
        >
            {data.values.map(({value, name, image, orderable, href}) => {
                return (
                    <Swatch
                        href={href}
                        key={value}
                        image={image}
                        disabled={!orderable}
                        value={value}
                        name={name}
                    >
                        <Box
                            h="100%"
                            w="100%"
                            minW="32px"
                            bgImage={image ? `url(${image.disBaseLink})` : ''}
                        />
                        <div>{value}</div>
                    </Swatch>
                )
            })}
        </SwatchGroup>
    )
}

describe('Swatch Component', () => {
    test('renders component', () => {
        const history = createMemoryHistory()
        history.push('/en-GB/swatch-example?color=JJ2XNXX')

        renderWithProviders(
            <Router history={history}>
                <Page />
            </Router>
        )
        expect(screen.getAllByRole('radio')).toHaveLength(data.values.length)
    })

    test('swatch can be selected', async () => {
        const history = createMemoryHistory()
        history.push('/en-GB/swatch-example')

        renderWithProviders(
            <Router history={history}>
                <Page />
            </Router>
        )

        expect(screen.getAllByRole('radio')).toHaveLength(data.values.length)
        const firstSwatch = screen.getAllByRole('radio')[2]
        fireEvent.click(firstSwatch)
        await waitFor(() => {
            expect(history.location.search).toBe('?color=JJ3HDXX')
        })
    })

    test('swatch can be changed with arrow keys', async () => {
        const history = createMemoryHistory()
        history.push('/en-GB/swatch-example?color=JJ2XNXX')

        renderWithProviders(
            <Router history={history}>
                <Page />
            </Router>
        )

        expect(screen.getAllByRole('radio')).toHaveLength(data.values.length)

        const swatchGroup = screen.getByRole('radiogroup').parentNode
        const keyDownEvents = [
            {
                keyEvent: arrowRight,
                expectedValue: 'JJ2XNXX'
            },
            {
                keyEvent: arrowDown,
                expectedValue: 'JJ3HDXX'
            },
            {
                keyEvent: arrowRight,
                expectedValue: 'BLACKFB'
            },
            {
                keyEvent: arrowLeft,
                expectedValue: 'JJ3HDXX'
            },
            {
                keyEvent: arrowUp,
                expectedValue: 'JJ2XNXX'
            },
            {
                keyEvent: arrowLeft,
                expectedValue: 'BLACKFB'
            }
        ]

        // Test initial state
        await waitFor(() => {
            expect(history.location.search).toBe('?color=JJ2XNXX')
        })

        // Navigate according to the event array. This also tests that looping over the end or front works.
        keyDownEvents.forEach(async ({keyEvent, expectedValue}) => {
            fireEvent.keyDown(swatchGroup, keyEvent)
            await waitFor(() => {
                expect(history.location.search).toBe(`?color=${expectedValue}`)
            })
        })
    })
})
