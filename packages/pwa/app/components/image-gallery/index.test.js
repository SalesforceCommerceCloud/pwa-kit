import React from 'react'
import {screen, render} from '@testing-library/react'
import {Router} from 'react-router-dom'
import ImageGallery from './index'
import {createMemoryHistory} from 'history'

describe('Image Gallery Component', () => {
    test('renders component with all images', () => {
        const history = createMemoryHistory()
        history.push('/en/image-gallery')

        render(
            <Router history={history}>
                <ImageGallery imageGroups={data} selectedVariationAttributes={{}} />
            </Router>
        )
        expect(screen.getAllByAltText(/Long Sleeve Crew Neck/).length).toEqual(7)
    })
})

const data = [
    {
        images: [
            {
                alt: 'Long Sleeve Crew Neck, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdecd59e1/images/large/PG.10219685.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdecd59e1/images/large/PG.10219685.JJ169XX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, '
            },
            {
                alt: 'Long Sleeve Crew Neck, , large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf5499885/images/large/PG.10219685.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf5499885/images/large/PG.10219685.JJ169XX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, '
            },
            {
                alt: 'Long Sleeve Crew Neck, Grey Heather, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw527e285c/images/large/PG.10219685.JJ2XNXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw527e285c/images/large/PG.10219685.JJ2XNXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            },
            {
                alt: 'Long Sleeve Crew Neck, Grey Heather, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf83f981b/images/large/PG.10219685.JJ2XNXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf83f981b/images/large/PG.10219685.JJ2XNXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            },
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw79303d2e/images/large/PG.10219685.JJ3HDXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw79303d2e/images/large/PG.10219685.JJ3HDXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            },
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb334c3e/images/large/PG.10219685.JJ3HDXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb334c3e/images/large/PG.10219685.JJ3HDXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Long Sleeve Crew Neck, Black, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdecd59e1/images/large/PG.10219685.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdecd59e1/images/large/PG.10219685.JJ169XX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Black'
            },
            {
                alt: 'Long Sleeve Crew Neck, Black, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf5499885/images/large/PG.10219685.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf5499885/images/large/PG.10219685.JJ169XX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Black'
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
                alt: 'Long Sleeve Crew Neck, Grey Heather, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw527e285c/images/large/PG.10219685.JJ2XNXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw527e285c/images/large/PG.10219685.JJ2XNXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            },
            {
                alt: 'Long Sleeve Crew Neck, Grey Heather, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf83f981b/images/large/PG.10219685.JJ2XNXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf83f981b/images/large/PG.10219685.JJ2XNXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ2XNXX'
                    }
                ]
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw79303d2e/images/large/PG.10219685.JJ3HDXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw79303d2e/images/large/PG.10219685.JJ3HDXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            },
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, large',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb334c3e/images/large/PG.10219685.JJ3HDXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwbb334c3e/images/large/PG.10219685.JJ3HDXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ3HDXX'
                    }
                ]
            }
        ],
        viewType: 'large'
    },
    {
        images: [
            {
                alt: 'Long Sleeve Crew Neck, , small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad08bce5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad08bce5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, '
            },
            {
                alt: 'Long Sleeve Crew Neck, , small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6f7bff4f/images/small/PG.10219685.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6f7bff4f/images/small/PG.10219685.JJ169XX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, '
            },
            {
                alt: 'Long Sleeve Crew Neck, Grey Heather, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw97dc399d/images/small/PG.10219685.JJ2XNXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw97dc399d/images/small/PG.10219685.JJ2XNXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            },
            {
                alt: 'Long Sleeve Crew Neck, Grey Heather, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa9c014d5/images/small/PG.10219685.JJ2XNXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa9c014d5/images/small/PG.10219685.JJ2XNXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            },
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3c1e3f/images/small/PG.10219685.JJ3HDXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3c1e3f/images/small/PG.10219685.JJ3HDXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            },
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6ed49a94/images/small/PG.10219685.JJ3HDXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6ed49a94/images/small/PG.10219685.JJ3HDXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            }
        ],
        viewType: 'small'
    },
    {
        images: [
            {
                alt: 'Long Sleeve Crew Neck, Black, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad08bce5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwad08bce5/images/small/PG.10219685.JJ169XX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Black'
            },
            {
                alt: 'Long Sleeve Crew Neck, Black, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6f7bff4f/images/small/PG.10219685.JJ169XX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6f7bff4f/images/small/PG.10219685.JJ169XX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Black'
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
                alt: 'Long Sleeve Crew Neck, Grey Heather, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw97dc399d/images/small/PG.10219685.JJ2XNXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw97dc399d/images/small/PG.10219685.JJ2XNXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            },
            {
                alt: 'Long Sleeve Crew Neck, Grey Heather, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa9c014d5/images/small/PG.10219685.JJ2XNXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa9c014d5/images/small/PG.10219685.JJ2XNXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Grey Heather'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ2XNXX'
                    }
                ]
            }
        ],
        viewType: 'small'
    },
    {
        images: [
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3c1e3f/images/small/PG.10219685.JJ3HDXX.PZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw5c3c1e3f/images/small/PG.10219685.JJ3HDXX.PZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            },
            {
                alt: 'Long Sleeve Crew Neck, Meadow Violet, small',
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6ed49a94/images/small/PG.10219685.JJ3HDXX.BZ.jpg',
                link:
                    'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6ed49a94/images/small/PG.10219685.JJ3HDXX.BZ.jpg',
                title: 'Long Sleeve Crew Neck, Meadow Violet'
            }
        ],
        variationAttributes: [
            {
                id: 'color',
                values: [
                    {
                        value: 'JJ3HDXX'
                    }
                ]
            }
        ],
        viewType: 'small'
    }
]
