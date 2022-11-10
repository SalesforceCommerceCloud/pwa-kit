/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
// import {UseQueryResult} from '@tanstack/react-query'

// NOTE: This type will change once the `commerce-sdk-isomorphic` is updated with
// support for pages.
type Client = ApiClients['shopperProducts']

const SAMPLE_PAGE_DATA = {
    "campaign-example": {
        "_v": "1",
        "_resource_state": "2958674e98940e511853411cfeac7e289b2b171c8761526f58c5c08aa74b55f4",
        "content_attributes": {
            "localized": false
        },
        "creation_date": "2022-06-22T01:18:33.000Z",
        "id": "campaign-example",
        "name": "campaign-example",
        "object_assignments": {
            "category_lookup_mode": "implicit"
        },
        "online": {
            "default@RefArch": true
        },
        "page_type_id": "storePage",
        "regions": [
            {
                "has_visibility_rules": false,
                "id": "headerbanner",
                "owner_id": "campaign-example",
                "type": "page"
            },
            {
                "components": [
                    {
                        "content_attributes": {
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "f3acc7ed038ac71bf8d5ad8843",
                        "name": "1 Row x 1 Col (Mobile), 1 Row x 1 Col (Desktop) Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "ITCLink": "$url('Search-Show', 'cgid', 'mens')$",
                                                "image": {
                                                    "path": "placeholder%20410x307.5.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                },
                                                "heading": "<p>Spring Collection</p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "59a75e1ed8f92b37a38171d2bb",
                                        "name": "Image And Text Component",
                                        "resource_state": "16c6515aa048890cbb9e42c2d16b58561d91aebf01033154758f6a443a885448",
                                        "type_id": "commerce_assets.imageAndText"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column1",
                                "owner_id": "f3acc7ed038ac71bf8d5ad8843",
                                "type": "component"
                            }
                        ],
                        "resource_state": "1c19887230525702f8c78f2b19d9299bbca5de84ac3a78adeca50c51ce779c2c",
                        "type_id": "commerce_layouts.mobileGrid1r1c"
                    },
                    {
                        "content_attributes": {
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "5b5007c32ce08e57d0d686369d",
                        "name": "2 Row x 1 Col (Mobile), 1 Row x 2 Col (Desktop) Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "richText": "<p><span style=\"color: rgb(0, 0, 0);\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </span></p><p></p><p><a href=\"$url('Search-Show', 'cgid', 'womens')$\" target=\"_self\" data-link-type=\"category\" data-link-label=\"Womens\" data-category-id=\"womens\" data-category-catalog-id=\"storefront-catalog-m-en\" style=\"color: rgb(0, 0, 0);\">Womens</a></p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "b3e5f9120102623f2a6ad9da67",
                                        "name": "Editorial Rich Text Component",
                                        "resource_state": "ccc1ac98b1643414fffc72ba9600e7893778e671c1a08f90a0166550085d3f34",
                                        "type_id": "commerce_assets.editorialRichText"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column1",
                                "owner_id": "5b5007c32ce08e57d0d686369d",
                                "type": "component"
                            },
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                }
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "98d50dc4ba975b668622a51636",
                                        "name": "Photo Tile Component",
                                        "resource_state": "4ec01abd05dfd864f59f2916bbc4b00749c1f7c9012455c7cd553067268003ef",
                                        "type_id": "commerce_assets.photoTile"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column2",
                                "owner_id": "5b5007c32ce08e57d0d686369d",
                                "type": "component"
                            }
                        ],
                        "resource_state": "8f5432769ceb2e2e3c9855dace2db0620ef90ca0c5d8c0dce3d4f570927ebcdd",
                        "type_id": "commerce_layouts.mobileGrid2r1c"
                    },
                    {
                        "content_attributes": {
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "9789f27343c21aea2def3ffb65",
                        "name": "2 Row x 1 Col (Mobile), 1 Row x 2 Col (Desktop) Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                }
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "17078d2c50a68c7d56c4cc65d9",
                                        "name": "Photo Tile Component",
                                        "resource_state": "73fe02e6683c610e08fe6f1e2ff2947deee86acd471255b2c7a196f029416e0f",
                                        "type_id": "commerce_assets.photoTile"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column1",
                                "owner_id": "9789f27343c21aea2def3ffb65",
                                "type": "component"
                            },
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "richText": "<p><span style=\"background-color: rgb(249, 249, 249); color: rgb(0, 0, 0);\">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</span></p><p></p><p><a style=\"background-color: rgb(249, 249, 249); color: rgb(0, 0, 0);\" data-category-catalog-id=\"storefront-catalog-m-en\" data-category-id=\"newarrivals\" data-link-label=\"New Arrivals\" data-link-type=\"category\" target=\"_self\" href=\"$url('Search-Show', 'cgid', 'newarrivals')$\">New Arrivals</a></p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "4ca336b2ac97a68be62a4b7444",
                                        "name": "Editorial Rich Text Component",
                                        "resource_state": "6283b345c11d04cd6e8fbb39f5d5116aa120a2bef6b36e6353182b75a9935a31",
                                        "type_id": "commerce_assets.editorialRichText"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column2",
                                "owner_id": "9789f27343c21aea2def3ffb65",
                                "type": "component"
                            }
                        ],
                        "resource_state": "52d59e082d27b668682a444153f26b294a487b6d2e5cd2d0e2c524d4c1cc73c4",
                        "type_id": "commerce_layouts.mobileGrid2r1c"
                    },
                    {
                        "content_attributes": {
                            "data": {
                                "xsCarouselIndicators": true,
                                "smCarouselControls": false,
                                "mdCarouselIndicators": false,
                                "xsCarouselControls": false,
                                "smCarouselIndicators": true,
                                "xsCarouselSlidesToDisplay": 1,
                                "mdCarouselSlidesToDisplay": 3,
                                "textHeadline": "Event Highlights",
                                "smCarouselSlidesToDisplay": 2
                            },
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "b14929ecc228accbd033c694a3",
                        "name": "Carousel Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "ITCLink": "$url('Search-Show', 'cgid', 'womens-clothing-tops')$",
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                },
                                                "heading": "<p>Check out Women's tops </p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "9f252879138998d7ee1751a23c",
                                        "name": "Image And Text Component",
                                        "resource_state": "54c04fcb4a9966d505a575eb7c6c2673920dc0b8a0687d011994667bf9a8b324",
                                        "type_id": "commerce_assets.imageAndText"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "ITCLink": "$url('Search-Show', 'cgid', 'mens-clothing-suits')$",
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                },
                                                "heading": "<p>Checkout Men's suits</p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "7e7c782c53c99451aa5fdae65f",
                                        "name": "Image And Text Component",
                                        "resource_state": "6ce73a10198575b9aa475f4a0d76691636ac79b1f4013ad8b9ac34781639347b",
                                        "type_id": "commerce_assets.imageAndText"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "ITCLink": "$url('Search-Show', 'cgid', 'mens-accessories-luggage')$",
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                },
                                                "heading": "<p>Checkout Men's Luggage</p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "1e84093400022a1211f5653256",
                                        "name": "Image And Text Component",
                                        "resource_state": "729ce6fd1b7ec4232caaf50d1444be7f7146cddbfcb0716033c40e3d958f2548",
                                        "type_id": "commerce_assets.imageAndText"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "ITCLink": "$url('Search-Show', 'cgid', 'womens-jewelry-necklaces')$",
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                },
                                                "heading": "<p>Checkout Women's Necklaces</p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "545dc0626407126f1f19c9055e",
                                        "name": "Image And Text Component",
                                        "resource_state": "12482135bc988a0ed25c7b144e6725b7791bc1779ed5fc158b5a65c6fa8e4153",
                                        "type_id": "commerce_assets.imageAndText"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "slides",
                                "owner_id": "b14929ecc228accbd033c694a3",
                                "type": "component"
                            }
                        ],
                        "resource_state": "cb2561fc17abc7ed789256a214b27d0aa1c2a028770d6f6b59547fce473c46a0",
                        "type_id": "commerce_layouts.carousel"
                    },
                    {
                        "content_attributes": {
                            "data": {
                                "xsCarouselIndicators": false,
                                "smCarouselControls": false,
                                "mdCarouselIndicators": false,
                                "xsCarouselControls": false,
                                "smCarouselIndicators": false,
                                "xsCarouselSlidesToDisplay": 2,
                                "mdCarouselSlidesToDisplay": 2,
                                "textHeadline": "Checkout our season categories",
                                "smCarouselSlidesToDisplay": 2
                            },
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "b844c2e6e5f8f0d9e03f98045c",
                        "name": "Carousel Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "ITCLink": "$url('Search-Show', 'cgid', 'mens-clothing-pants')$",
                                                "ITCText": "<p><a data-category-catalog-id=\"storefront-catalog-m-en\" data-category-id=\"mens-clothing-pants\" data-link-label=\"Pants\" data-link-type=\"category\" target=\"_self\" href=\"$url('Search-Show', 'cgid', 'mens-clothing-pants')$\">Mens Pant's</a></p>",
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                },
                                                "heading": ""
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "5a03a67bdab7635e264c312e3f",
                                        "name": "Image And Text Component",
                                        "resource_state": "b91e18ca0a4d49d8270f4501fd3178ac434c42333b92c1ca848dcb3e91cc55ae",
                                        "type_id": "commerce_assets.imageAndText"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "ITCLink": "$url('Search-Show', 'cgid', 'womens-clothing-bottoms')$",
                                                "ITCText": "<p><a data-category-catalog-id=\"storefront-catalog-m-en\" data-category-id=\"womens-clothing-bottoms\" data-link-label=\"Bottoms\" data-link-type=\"category\" target=\"_self\" href=\"$url('Search-Show', 'cgid', 'womens-clothing-bottoms')$\">Women's Pants &amp; Dresses</a></p>",
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                }
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "b6dbbab450375b6de386af58a0",
                                        "name": "Image And Text Component",
                                        "resource_state": "46fff5100e228813a1cc63efba7ba66ef33601aa253c5934b4d4de65ca1731a2",
                                        "type_id": "commerce_assets.imageAndText"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "slides",
                                "owner_id": "b844c2e6e5f8f0d9e03f98045c",
                                "type": "component"
                            }
                        ],
                        "resource_state": "2dff6aaeb597f9013e06806df365eff103582008e9ba16bcc4c593bbb63535fc",
                        "type_id": "commerce_layouts.carousel"
                    },
                    {
                        "content_attributes": {
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "8af9144c754dd21a8e42fae03c",
                        "name": "1 Row x 1 Col (Mobile), 1 Row x 1 Col (Desktop) Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "image": {
                                                    "path": "placeholder%20410x307.5.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                },
                                                "heading": "<h2>Shop Red</h2>",
                                                "categoryLink": "newarrivals-womens"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "8cddfbd065f71ed7e222ab39fa",
                                        "name": "Main Banner Component",
                                        "resource_state": "7d8af18b54362b692b81e2b596797911e6f774b81609f7b64b66183946b81d90",
                                        "type_id": "commerce_assets.mainBanner"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "richText": "<h2>Shop The Look</h2><p>See all</p>"
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "a8e7580b7d8d8d11bfc04dbf34",
                                        "name": "Editorial Rich Text Component",
                                        "resource_state": "78a2a5026a2e4fd032cb336968a9e28d1c3720950831d97deecb289b1895eccc",
                                        "type_id": "commerce_assets.editorialRichText"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column1",
                                "owner_id": "8af9144c754dd21a8e42fae03c",
                                "type": "component"
                            }
                        ],
                        "resource_state": "ef25645099de0e930fe0cedaf906e1784428b9297d4050ccfe0a831b08d938cf",
                        "type_id": "commerce_layouts.mobileGrid1r1c"
                    },
                    {
                        "content_attributes": {
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "2ad87f5459ab8fde0c4f59c14e",
                        "name": "3 Row x 1 Col (Mobile), 1 Row x 3 Col (Desktop) Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "701642854784M",
                                                "priceDisplay": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "36a3900a78af117b4e5cc7daec",
                                        "name": "Shop The Look Component",
                                        "resource_state": "4f56d82313f8c827b6ae14f5edcd7145944563ef8d4276113e956236ff2223e9",
                                        "type_id": "commerce_assets.shopTheLook"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column1",
                                "owner_id": "2ad87f5459ab8fde0c4f59c14e",
                                "type": "component"
                            },
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "25493571M",
                                                "priceDisplay": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "6fbafc14223bfc4234011b4e40",
                                        "name": "Shop The Look Component",
                                        "resource_state": "c4e3d82f6e7d8f4fe43b009cb7c50d559c822de98545569ff0bfd74532a95e4e",
                                        "type_id": "commerce_assets.shopTheLook"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column2",
                                "owner_id": "2ad87f5459ab8fde0c4f59c14e",
                                "type": "component"
                            },
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "25695305M",
                                                "priceDisplay": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "316bc95e8aca7e66599640fb04",
                                        "name": "Shop The Look Component",
                                        "resource_state": "b9d49909e16598b99f5dd5de9e3d958860c153106f485e59916bd2f47ac77aa7",
                                        "type_id": "commerce_assets.shopTheLook"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column3",
                                "owner_id": "2ad87f5459ab8fde0c4f59c14e",
                                "type": "component"
                            }
                        ],
                        "resource_state": "daede1a361b60574d90168d10e2dc1a5b2873b6effd230f76eef11bc5b93ae70",
                        "type_id": "commerce_layouts.mobileGrid3r1c"
                    },
                    {
                        "content_attributes": {
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "f2a8d8c663f14f6c1a06195661",
                        "name": "2 Row x 1 Col (Mobile), 1 Row x 2 Col (Desktop) Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "image": {
                                                    "path": "placeholder%20410x410.png",
                                                    "focal_point": {
                                                        "x": 0.5,
                                                        "y": 0.5
                                                    }
                                                }
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "7832453b4752958d8e530b9f35",
                                        "name": "Photo Tile Component",
                                        "resource_state": "f398e61d660fdccb397400b64512a482be994765ec14259c799d1f65a3c00848",
                                        "type_id": "commerce_assets.photoTile"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column1",
                                "owner_id": "f2a8d8c663f14f6c1a06195661",
                                "type": "component"
                            },
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "7ccefe7229cc31d9689598f036",
                                        "name": "1 Row x 1 Col (Mobile), 1 Row x 1 Col (Desktop) Component",
                                        "regions": [
                                            {
                                                "components": [
                                                    {
                                                        "content_attributes": {
                                                            "data": {
                                                                "image": {
                                                                    "path": "placeholder%20410x410.png",
                                                                    "focal_point": {
                                                                        "x": 0.5,
                                                                        "y": 0.5
                                                                    }
                                                                }
                                                            },
                                                            "localized": true
                                                        },
                                                        "has_visibility_rules": false,
                                                        "id": "d990211480592ee5a9fe43078f",
                                                        "name": "Photo Tile Component",
                                                        "resource_state": "d40299dced40535779a0cef4d9dfdfb754f7416309cf5229718a6c159ba2bd0a",
                                                        "type_id": "commerce_assets.photoTile"
                                                    }
                                                ],
                                                "has_visibility_rules": false,
                                                "id": "column1",
                                                "owner_id": "7ccefe7229cc31d9689598f036",
                                                "type": "component"
                                            }
                                        ],
                                        "resource_state": "6da97d2c7ff227d36735a8c0cf7c8a2627fb3cc844569269e91fb385eef014ba",
                                        "type_id": "commerce_layouts.mobileGrid1r1c"
                                    },
                                    {
                                        "content_attributes": {
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "f705f7acecef97f2b824fa8cb8",
                                        "name": "1 Row x 1 Col (Mobile), 1 Row x 1 Col (Desktop) Component",
                                        "regions": [
                                            {
                                                "components": [
                                                    {
                                                        "content_attributes": {
                                                            "data": {
                                                                "image": {
                                                                    "path": "placeholder%20410x410.png",
                                                                    "focal_point": {
                                                                        "x": 0.5,
                                                                        "y": 0.5
                                                                    }
                                                                }
                                                            },
                                                            "localized": true
                                                        },
                                                        "has_visibility_rules": false,
                                                        "id": "de2e208af1aadb58276550cb85",
                                                        "name": "Photo Tile Component",
                                                        "resource_state": "d124e6708caa689817f1e942b10a37fe606960f42f0881d75a4c401a7a0db03a",
                                                        "type_id": "commerce_assets.photoTile"
                                                    }
                                                ],
                                                "has_visibility_rules": false,
                                                "id": "column1",
                                                "owner_id": "f705f7acecef97f2b824fa8cb8",
                                                "type": "component"
                                            }
                                        ],
                                        "resource_state": "a58d4f141d204fe906018fb9057b5e9f082b737eb20d62f6e09fc11aefc9b840",
                                        "type_id": "commerce_layouts.mobileGrid1r1c"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "column2",
                                "owner_id": "f2a8d8c663f14f6c1a06195661",
                                "type": "component"
                            }
                        ],
                        "resource_state": "017c49dfbe24502c2e94c61c3853553a58b9be28530eb3f69ed97e4c66803c56",
                        "type_id": "commerce_layouts.mobileGrid2r1c"
                    },
                    {
                        "content_attributes": {
                            "data": {
                                "xsCarouselIndicators": true,
                                "smCarouselControls": false,
                                "mdCarouselIndicators": false,
                                "xsCarouselControls": false,
                                "smCarouselIndicators": true,
                                "xsCarouselSlidesToDisplay": 2,
                                "mdCarouselSlidesToDisplay": 4,
                                "textHeadline": "You May Also Like",
                                "smCarouselSlidesToDisplay": 2
                            },
                            "localized": true
                        },
                        "has_visibility_rules": false,
                        "id": "606672d3858fadaa74e75a94b6",
                        "name": "Carousel Component",
                        "regions": [
                            {
                                "components": [
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "013742002881M",
                                                "displayRatings": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "3cea56e2a12a1df90fb5c30632",
                                        "name": "Product Tile Component",
                                        "resource_state": "c51ea32b580135d68cf6dcd23e9a634a9eb7dbc5ca631254987de2a24b76b305",
                                        "type_id": "commerce_assets.productTile"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "883360544007M",
                                                "displayRatings": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "f440debd8b1d9dad90970b1ff3",
                                        "name": "Product Tile Component",
                                        "resource_state": "f08e4501f790ce242e2cea5fa59da61e7005f06ce186ace431f002a2b37a3efd",
                                        "type_id": "commerce_assets.productTile"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "793775064963M",
                                                "displayRatings": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "dcc269b3be9cbde5c5786aa265",
                                        "name": "Product Tile Component",
                                        "resource_state": "08eb59d9aab73200e14d4940dac1cbd6ddfac18c62ee12e72498aacba9ec6faa",
                                        "type_id": "commerce_assets.productTile"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "799927757332M",
                                                "displayRatings": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "735e44ce9238e535bbcd475bbb",
                                        "name": "Product Tile Component",
                                        "resource_state": "b6ecf416a2950c773ff0864f6cc827172f3f7d95db191ec6b2fe8e3c102bbbab",
                                        "type_id": "commerce_assets.productTile"
                                    },
                                    {
                                        "content_attributes": {
                                            "data": {
                                                "product": "740357447232M",
                                                "displayRatings": false
                                            },
                                            "localized": true
                                        },
                                        "has_visibility_rules": false,
                                        "id": "e1e2eab9a8455daecbcceda4e2",
                                        "name": "Product Tile Component",
                                        "resource_state": "56a9b34f08f82267eef58d8601daa881c8ddbe6d022f68bd024f19fa6437fa7d",
                                        "type_id": "commerce_assets.productTile"
                                    }
                                ],
                                "has_visibility_rules": false,
                                "id": "slides",
                                "owner_id": "606672d3858fadaa74e75a94b6",
                                "type": "component"
                            }
                        ],
                        "resource_state": "cdfed3b4fa25a1841e4863aa84d6781bab07fb78b121f35da7d245052260ebeb",
                        "type_id": "commerce_layouts.carousel"
                    }
                ],
                "has_visibility_rules": false,
                "id": "main",
                "owner_id": "campaign-example",
                "type": "page"
            }
        ],
        "repository_information": {
            "id": "RefArchSharedLibrary",
            "name": "",
            "site_information": [
                {
                    "page_online": true,
                    "page_searchable": false,
                    "page_status": "ok",
                    "site_info": {
                        "site_id": "01c3b6b4c5fc63f9ebf6d34017",
                        "site_name": "Sites-RefArch-Site"
                    }
                },
                {
                    "page_online": false,
                    "page_searchable": false,
                    "page_status": "ok",
                    "site_info": {
                        "site_id": "0da081eb66e67f871bdb7edec7",
                        "site_name": "Sites-RefArchGlobal-Site"
                    }
                }
            ],
            "uuid": "85c34efb3f7a8bd29479cdf307"
        },
        "searchable": {
            "default@RefArch": false
        },
        "site_map_included": {
            "default@RefArch": false
        },
        "visibility_mode": "visible"
    }
}

type PageKey = keyof typeof SAMPLE_PAGE_DATA

/**
 * A hook for `ShopperExperiences#getShopperExperience`.
 * Gets the shopper's context based on the shopperJWT. ******** This API is currently a work in progress, and not available to use yet. ********
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-contexts?meta=getShopperExperience} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercontexts.shoppercontexts-1.html#getshoppercontext} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useShopperPage = (arg : Argument<Client['getProduct']>): Object => {  
    return useQuery(['pages', arg], () => {
        const promise = 
            new Promise((resolve) => setTimeout(resolve, 1000))
                .then(() => {
                    return arg?.parameters.id ? SAMPLE_PAGE_DATA[arg?.parameters?.id as PageKey] : undefined
                })

        return promise
    })
}

