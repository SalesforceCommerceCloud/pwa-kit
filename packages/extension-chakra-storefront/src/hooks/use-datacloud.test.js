/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {waitFor} from '@testing-library/react'
import useDataCloud from './use-datacloud'
import {useCurrentCustomer} from './use-current-customer'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {
    mockLoginViewPageEvent,
    mockViewProductEvent,
    mockViewCategoryEvent,
    mockViewSearchResultsEvent,
    mockViewRecommendationsEvent,
    mockSearchParam,
    mockGloveSearchResult,
    mockCategorySearchParams,
    mockRecommendationIds,
    mockLoginViewPageEventDNT
} from '../mocks/datacloud-mock-data'
import {
    mockProduct,
    mockCategory,
    mockSearchResults,
    mockRecommenderDetails
} from '../hooks/einstein-mock-data'
import {renderWithProviders} from '../utils/test-utils'

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useUsid: () => {
            return {
                getUsidWhenReady: jest.fn(() => {
                    return 'guest-usid'
                })
            }
        },
        useCustomerType: jest.fn(() => {
            return {isRegistered: true}
        }),
        useDNT: jest.fn(() => {
            return {effectiveDnt: false}
        })
    }
})

jest.mock('./use-current-customer', () => ({
    useCurrentCustomer: jest.fn(() => {
        return {
            data: {
                customerId: 1234567890,
                firstName: 'John',
                lastName: 'Smith',
                email: 'johnsmith@salesforce.com'
            }
        }
    })
}))
// jest.mock('js-cookie', () => {
//     const originalModule = jest.requireActual('js-cookie')

//     return {
//         ...originalModule,
//         get: jest.fn(() => 'mockCookieValue')
//     }
// })

const mockWebEventsAppSourceIdPost = jest.fn()
jest.mock('@salesforce/cc-datacloud-typescript', () => {
    return {
        initDataCloudSdk: () => {
            return {
                webEventsAppSourceIdPost: mockWebEventsAppSourceIdPost
            }
        }
    }
})

const MockComponent = ({event, args}) => {
    const dataCloud = useDataCloud()

    // Trigger configured event on mount.
    useEffect(() => {
        dataCloud[event](...args)
    }, [])

    return <></>
}

MockComponent.propTypes = {
    event: PropTypes.string,
    args: PropTypes.array
}

describe.skip('useDataCloud', function () {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('sendViewPage', async () => {
        renderWithProviders(<MockComponent event="sendViewPage" args={['/login']} />, {
            wrapperProps: {
                site: {
                    id: 'RefArch'
                }
            }
        })

        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockLoginViewPageEvent)
        })
    })

    test('sendViewPage does not send Profile event when DNT is enabled', async () => {
        useDNT.mockReturnValueOnce({
            effectiveDnt: true
        })
        renderWithProviders(<MockComponent event="sendViewPage" args={['/login']} />, {
            wrapperProps: {
                site: {
                    id: 'RefArch'
                }
            }
        })
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockLoginViewPageEventDNT)
        })
    })

    test('sendViewProduct', async () => {
        renderWithProviders(<MockComponent event="sendViewProduct" args={[mockProduct]} />, {
            wrapperProps: {
                site: {
                    id: 'RefArch'
                }
            }
        })

        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewProductEvent)
        })
    })

    test('sendViewCategory with no email', async () => {
        useCurrentCustomer.mockReturnValue({
            data: {
                customerId: 1234567890,
                firstName: 'John',
                lastName: 'Smith'
            }
        })

        renderWithProviders(
            <MockComponent
                event="sendViewCategory"
                args={[mockCategorySearchParams, mockCategory, mockSearchResults]}
            />,
            {
                wrapperProps: {
                    site: {
                        id: 'RefArch'
                    }
                }
            }
        )

        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewCategoryEvent)
        })
    })

    test('sendViewSearchResults with no email', async () => {
        renderWithProviders(
            <MockComponent
                event="sendViewSearchResults"
                args={[mockSearchParam, mockGloveSearchResult]}
            />,
            {
                wrapperProps: {
                    site: {
                        id: 'RefArch'
                    }
                }
            }
        )

        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewSearchResultsEvent)
        })
    })

    test('sendViewRecommendations with non email', async () => {
        renderWithProviders(
            <MockComponent
                event="sendViewRecommendations"
                args={[mockRecommenderDetails, mockRecommendationIds]}
            />,
            {
                wrapperProps: {
                    site: {
                        id: 'RefArch'
                    }
                }
            }
        )

        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewRecommendationsEvent)
        })
    })
})
