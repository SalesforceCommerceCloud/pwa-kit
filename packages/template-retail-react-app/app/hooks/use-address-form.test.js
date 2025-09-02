/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderHook, act} from '@testing-library/react'
import {useAddressForm} from '@salesforce/retail-react-app/app/hooks/use-address-form'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {nanoid} from 'nanoid'

// Mock dependencies
jest.mock('./use-toast')
jest.mock('./use-current-customer')
jest.mock('@salesforce/commerce-sdk-react')
jest.mock('nanoid')
jest.mock('react-intl', () => ({
    useIntl: () => ({
        formatMessage: jest.fn(({defaultMessage}) => defaultMessage)
    })
}))

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
    useForm: () => ({
        reset: jest.fn(),
        clearErrors: jest.fn(),
        formState: {
            errors: {},
            isSubmitting: false
        }
    })
}))

const mockUseToast = useToast
const mockUseCurrentCustomer = useCurrentCustomer
const mockUseShopperCustomersMutation = useShopperCustomersMutation
const mockNanoid = nanoid

describe('useAddressForm', () => {
    const mockAddGuestAddress = jest.fn()
    const mockIsGuest = false
    const mockSetAddressesForItems = jest.fn()
    const mockAvailableAddresses = []
    const mockDeliveryItems = [
        {itemId: 'item-1', productId: 'product-1'},
        {itemId: 'item-2', productId: 'product-2'}
    ]
    const mockAreAddressesEqual = jest.fn().mockReturnValue(false)

    const mockShowToast = jest.fn()
    const mockCustomer = {customerId: 'customer-1'}
    const mockRefetchCustomer = jest.fn()
    const mockCreateCustomerAddress = {
        mutateAsync: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()

        mockUseToast.mockReturnValue(mockShowToast)
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            refetch: mockRefetchCustomer
        })
        mockUseShopperCustomersMutation.mockReturnValue(mockCreateCustomerAddress)
        mockNanoid.mockReturnValue('test-id-123')

        // Reset mock functions
        mockAddGuestAddress.mockClear()
        mockSetAddressesForItems.mockClear()
        mockAreAddressesEqual.mockClear()
        mockAreAddressesEqual.mockReturnValue(false)
        mockShowToast.mockClear()
        mockRefetchCustomer.mockClear()
        mockCreateCustomerAddress.mutateAsync.mockClear()
    })

    describe('hook initialization', () => {
        it('should initialize with default form state', () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            expect(result.current.form).toBeDefined()
            expect(result.current.formStateByItemId).toEqual({})
            expect(result.current.isSubmitting).toBe(false)
            expect(result.current.isAddressFormOpen).toBe(false)
        })

        it('should return all required functions and state', () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            expect(result.current.openForm).toBeDefined()
            expect(result.current.closeForm).toBeDefined()
            expect(result.current.handleCreateAddress).toBeDefined()
            expect(result.current.formErrors).toBeDefined()
        })
    })

    describe('form state management', () => {
        it('should open form for specific item', async () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            await act(async () => {
                result.current.openForm('item-1')
            })

            expect(result.current.formStateByItemId).toEqual({'item-1': true})
            expect(result.current.isAddressFormOpen).toBe(true)
        })

        it('should close form for specific item', async () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            await act(async () => {
                result.current.openForm('item-1')
            })

            await act(async () => {
                result.current.closeForm('item-1')
            })

            expect(result.current.formStateByItemId).toEqual({'item-1': false})
            expect(result.current.isAddressFormOpen).toBe(false)
        })

        it('should handle multiple forms open simultaneously', async () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            await act(async () => {
                result.current.openForm('item-1')
                result.current.openForm('item-2')
            })

            expect(result.current.formStateByItemId).toEqual({
                'item-1': true,
                'item-2': true
            })
            expect(result.current.isAddressFormOpen).toBe(true)
        })
    })

    describe('address creation - guest users', () => {
        it('should create guest address successfully', async () => {
            const mockGuestAddress = {addressId: 'guest-123', isGuestAddress: true}
            mockAddGuestAddress.mockReturnValue(mockGuestAddress)

            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    true,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            const addressData = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345'
            }

            await act(async () => {
                const newAddress = await result.current.handleCreateAddress(addressData, 'item-1')
                expect(newAddress).toEqual(mockGuestAddress)
            })

            expect(mockAddGuestAddress).toHaveBeenCalledWith(addressData)
            expect(mockShowToast).toHaveBeenCalledWith({
                title: expect.any(Array),
                status: 'success'
            })
        })

        it('should assign first guest address to all items', async () => {
            const mockGuestAddress = {addressId: 'guest-123', isGuestAddress: true}
            mockAddGuestAddress.mockReturnValue(mockGuestAddress)

            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    true,
                    mockSetAddressesForItems,
                    [], // no addresses
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            const addressData = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345'
            }

            await act(async () => {
                await result.current.handleCreateAddress(addressData, 'item-1')
            })

            expect(mockSetAddressesForItems).toHaveBeenCalledWith(['item-1', 'item-2'], 'guest-123')
        })
    })

    describe('address creation - registered users', () => {
        it('should create registered user address successfully', async () => {
            const mockCreatedAddress = {addressId: 'addr-123'}
            mockCreateCustomerAddress.mutateAsync.mockResolvedValue(mockCreatedAddress)

            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    false,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            const addressData = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345',
                address2: 'Apt 1',
                companyName: 'Test Company'
            }

            await act(async () => {
                const newAddress = await result.current.handleCreateAddress(addressData, 'item-1')
                expect(newAddress).toEqual(mockCreatedAddress)
            })

            expect(mockCreateCustomerAddress.mutateAsync).toHaveBeenCalledWith({
                body: {
                    addressId: 'addr_test-id-123',
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: undefined,
                    countryCode: undefined,
                    address1: '123 Test St',
                    city: 'Test City',
                    stateCode: 'CA',
                    postalCode: '12345',
                    address2: 'Apt 1',
                    companyName: 'Test Company',
                    preferred: false
                },
                parameters: {customerId: 'customer-1'}
            })
            expect(mockRefetchCustomer).toHaveBeenCalled()
            expect(mockShowToast).toHaveBeenCalledWith({
                title: expect.any(Array),
                status: 'success'
            })
        })

        it('should handle API failure during address creation', async () => {
            mockCreateCustomerAddress.mutateAsync.mockRejectedValue(new Error('API Error'))

            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    false,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            const addressData = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345'
            }

            await act(async () => {
                const newAddress = await result.current.handleCreateAddress(addressData, 'item-1')
                expect(newAddress).toBeUndefined()
            })

            expect(mockShowToast).toHaveBeenCalledWith({
                title: expect.any(Array),
                status: 'error'
            })
        })
    })

    describe('duplicate address prevention', () => {
        it('should detect and prevent duplicate addresses', async () => {
            const existingAddress = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345'
            }
            const mockAvailableAddresses = [existingAddress]
            mockAreAddressesEqual.mockReturnValue(true)

            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            const duplicateAddressData = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345'
            }

            await act(async () => {
                const newAddress = await result.current.handleCreateAddress(
                    duplicateAddressData,
                    'item-1'
                )
                expect(newAddress).toBeNull()
            })

            expect(mockShowToast).toHaveBeenCalledWith({
                title: expect.any(Array),
                status: 'info'
            })
            expect(result.current.formStateByItemId).toEqual({'item-1': false})
        })

        it('should close form and reset after duplicate detection', async () => {
            const existingAddress = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345'
            }
            const mockAvailableAddresses = [existingAddress]
            mockAreAddressesEqual.mockReturnValue(true)

            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            await act(async () => {
                result.current.openForm('item-1')
            })

            const duplicateAddressData = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Test St',
                city: 'Test City',
                stateCode: 'CA',
                postalCode: '12345'
            }

            await act(async () => {
                await result.current.handleCreateAddress(duplicateAddressData, 'item-1')
            })

            expect(result.current.formStateByItemId).toEqual({'item-1': false})
            expect(result.current.isSubmitting).toBe(false)
        })
    })

    describe('form submission state', () => {
        it('should handle isSubmitting state correctly', async () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            // initial state
            expect(result.current.isSubmitting).toBe(false)

            // verify the hook provides expected interface
            expect(typeof result.current.handleCreateAddress).toBe('function')
            expect(typeof result.current.openForm).toBe('function')
            expect(typeof result.current.closeForm).toBe('function')
        })
    })

    describe('form cleanup after successful submission', () => {
        it('should provide form management functions', async () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    mockDeliveryItems,
                    mockAreAddressesEqual
                )
            )

            // Verify form management functions
            expect(typeof result.current.form.reset).toBe('function')
            expect(typeof result.current.form.clearErrors).toBe('function')
            expect(result.current.form.formState.errors).toEqual({})
        })
    })

    describe('edge cases', () => {
        it('should handle empty delivery items array', async () => {
            const {result} = renderHook(() =>
                useAddressForm(
                    mockAddGuestAddress,
                    mockIsGuest,
                    mockSetAddressesForItems,
                    mockAvailableAddresses,
                    [], // no delivery items
                    mockAreAddressesEqual
                )
            )

            expect(result.current).toBeDefined()
        })
    })
})
