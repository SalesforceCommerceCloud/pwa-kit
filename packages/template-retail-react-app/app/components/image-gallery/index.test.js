/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

import {screen, fireEvent, waitFor} from '@testing-library/react'
import ImageGallery from './index'
import {Skeleton as ImageGallerySkeleton} from './index'
import {createMemoryHistory} from 'history'
import {renderWithProviders} from '../../utils/test-utils'

const MockComponent = ({imageGroups = [], selectedVariationAttributes = {}}) => {
    return !imageGroups.length ? (
        <ImageGallerySkeleton />
    ) : (
        <ImageGallery
            imageGroups={imageGroups}
            selectedVariationAttributes={selectedVariationAttributes}
        />
    )
}
MockComponent.propTypes = {
    imageGroups: PropTypes.array,
    selectedVariationAttributes: PropTypes.object
}
describe('Image Gallery Component', () => {
    test('renders component with all images', () => {
        renderWithProviders(<MockComponent imageGroups={data} selectedVariationAttributes={{}} />)
        expect(screen.getAllByAltText(/Ruffle Front V-Neck Cardigan/).length).toEqual(3)
    })

    test('render skeleton', () => {
        renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('sf-image-gallery-skeleton')).toBeInTheDocument()
    })

    test('can select thumbnail image with enter keyboard', async () => {
        const history = createMemoryHistory()

        renderWithProviders(
            <MockComponent imageGroups={data} selectedVariationAttributes={{}} history={history} />
        )
        const thumbnailImages = screen.getAllByTestId('image-gallery-thumbnails')
        const lastThumbnailImage = thumbnailImages[thumbnailImages.length - 1]
        lastThumbnailImage.focus()
        expect(lastThumbnailImage).toHaveFocus()
        fireEvent.keyDown(lastThumbnailImage, {key: 'Enter', code: 'Enter', keyCode: 13})
        await waitFor(() => {
            expect(screen.getByAltText(/Ruffle Front V-Neck Cardigan, , large/)).toHaveAttribute(
                'src',
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg'
            )
        })
    })

    test('can select thumbnail image by clicking on the image', async () => {
        const history = createMemoryHistory()

        renderWithProviders(
            <MockComponent imageGroups={data} selectedVariationAttributes={{}} history={history} />
        )
        const thumbnailImages = screen.getAllByTestId('image-gallery-thumbnails')
        const lastThumbnailImage = thumbnailImages[thumbnailImages.length - 1]

        fireEvent.click(lastThumbnailImage)
        await waitFor(() => {
            expect(screen.getByAltText(/Ruffle Front V-Neck Cardigan, , large/)).toHaveAttribute(
                'src',
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg'
            )
        })
    })
})

const data = [
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, '
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, '
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Black, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Black'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Black, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf67d39ef/images/large/PG.10216885.JJ169XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Black'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ169XX'
                    }
                ]
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Icy Mint, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa1d99f48/images/large/PG.10216885.JJ8UTXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa1d99f48/images/large/PG.10216885.JJ8UTXX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Icy Mint'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Icy Mint, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2aee1854/images/large/PG.10216885.JJ8UTXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2aee1854/images/large/PG.10216885.JJ8UTXX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Icy Mint'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ8UTXX'
                    }
                ]
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Grey Heather, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw01a849a1/images/large/PG.10216885.JJ908XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw01a849a1/images/large/PG.10216885.JJ908XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Grey Heather'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Grey Heather, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw54a4f8aa/images/large/PG.10216885.JJ908XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw54a4f8aa/images/large/PG.10216885.JJ908XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Grey Heather'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ908XX'
                    }
                ]
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, White, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc71d06b7/images/large/PG.10216885.JJI15XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc71d06b7/images/large/PG.10216885.JJI15XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, White'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, White, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw52d9334e/images/large/PG.10216885.JJI15XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw52d9334e/images/large/PG.10216885.JJI15XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, White'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJI15XX'
                    }
                ]
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, , medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc31527c1/images/medium/PG.10216885.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc31527c1/images/medium/PG.10216885.JJ169XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, '
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, , medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3b11511c/images/medium/PG.10216885.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3b11511c/images/medium/PG.10216885.JJ169XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, '
            }
        ],
        viewType: 'medium'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Black, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc31527c1/images/medium/PG.10216885.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwc31527c1/images/medium/PG.10216885.JJ169XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Black'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Black, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3b11511c/images/medium/PG.10216885.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3b11511c/images/medium/PG.10216885.JJ169XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Black'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ169XX'
                    }
                ]
            }
        ],
        viewType: 'medium'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Icy Mint, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwae3c27b4/images/medium/PG.10216885.JJ8UTXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwae3c27b4/images/medium/PG.10216885.JJ8UTXX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Icy Mint'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Icy Mint, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcbbada6e/images/medium/PG.10216885.JJ8UTXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwcbbada6e/images/medium/PG.10216885.JJ8UTXX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Icy Mint'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ8UTXX'
                    }
                ]
            }
        ],
        viewType: 'medium'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Grey Heather, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw636662ae/images/medium/PG.10216885.JJ908XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw636662ae/images/medium/PG.10216885.JJ908XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Grey Heather'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Grey Heather, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw77947f93/images/medium/PG.10216885.JJ908XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw77947f93/images/medium/PG.10216885.JJ908XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Grey Heather'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ908XX'
                    }
                ]
            }
        ],
        viewType: 'medium'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, White, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa32e1f75/images/medium/PG.10216885.JJI15XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa32e1f75/images/medium/PG.10216885.JJI15XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, White'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, White, medium',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw10b25b53/images/medium/PG.10216885.JJI15XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw10b25b53/images/medium/PG.10216885.JJI15XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, White'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJI15XX'
                    }
                ]
            }
        ],
        viewType: 'medium'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, , small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ada76e4/images/small/PG.10216885.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ada76e4/images/small/PG.10216885.JJ169XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, '
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, , small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3e4bf4/images/small/PG.10216885.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3e4bf4/images/small/PG.10216885.JJ169XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, '
            }
        ],
        viewType: 'small'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Black, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ada76e4/images/small/PG.10216885.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4ada76e4/images/small/PG.10216885.JJ169XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Black'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Black, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3e4bf4/images/small/PG.10216885.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3e4bf4/images/small/PG.10216885.JJ169XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Black'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ169XX'
                    }
                ]
            }
        ],
        viewType: 'small'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Icy Mint, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5d6b00b9/images/small/PG.10216885.JJ8UTXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5d6b00b9/images/small/PG.10216885.JJ8UTXX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Icy Mint'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Icy Mint, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa36098c/images/small/PG.10216885.JJ8UTXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwfa36098c/images/small/PG.10216885.JJ8UTXX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Icy Mint'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ8UTXX'
                    }
                ]
            }
        ],
        viewType: 'small'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, Grey Heather, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw61257164/images/small/PG.10216885.JJ908XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw61257164/images/small/PG.10216885.JJ908XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Grey Heather'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, Grey Heather, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbafa96c5/images/small/PG.10216885.JJ908XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbafa96c5/images/small/PG.10216885.JJ908XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, Grey Heather'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ908XX'
                    }
                ]
            }
        ],
        viewType: 'small'
    },
    {
        images: [
            {
                alt: 'Ruffle Front V-Neck Cardigan, White, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbee5712e/images/small/PG.10216885.JJI15XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbee5712e/images/small/PG.10216885.JJI15XX.PZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, White'
            },
            {
                alt: 'Ruffle Front V-Neck Cardigan, White, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6d458e21/images/small/PG.10216885.JJI15XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6d458e21/images/small/PG.10216885.JJI15XX.BZ.jpg',
                title: 'Ruffle Front V-Neck Cardigan, White'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJI15XX'
                    }
                ]
            }
        ],
        viewType: 'small'
    }
]
