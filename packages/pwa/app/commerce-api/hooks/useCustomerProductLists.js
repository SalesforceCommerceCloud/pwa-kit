import {useContext, useMemo, useEffect, useState} from 'react'
import {
    isError,
    useCommerceAPI,
    CustomerProductListsContext,
    convertSnakeCaseToSentenceCase
} from '../utils'
import useCustomer from './useCustomer'
import {customerProductListTypes} from '../../constants'
import {useToast} from '@chakra-ui/react'

// If the customerProductLists haven't yet loaded we store user actions inside
// eventQueue and process the eventQueue once productLists have loaded
const eventQueue = []

export const eventActions = {
    ADD: 'add',
    REMOVE: 'remove'
}

export default function useCustomerProductLists() {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const toast = useToast()
    const [isLoading, setIsLoading] = useState(false)

    const {customerProductLists, setCustomerProductLists} = useContext(CustomerProductListsContext)
    const showToast = (title, status) => {
        const toastId = `${title}-${status}`
        if (!toast.isActive(toastId)) {
            // Prevent duplicate toasts
            toast({
                id: toastId,
                title,
                status,
                isClosable: true,
                position: 'top-right',
                variant: 'subtle'
            })
        }
    }
    const processEventQueue = () => {
        eventQueue.forEach(async (event) => {
            eventQueue.pop()

            switch (event.action) {
                case eventActions.ADD: {
                    try {
                        await addItemToCustomerProductList(event.item, event.listId, event.listType)
                        showToast(
                            `1 item added to ${convertSnakeCaseToSentenceCase(event.listType)}`,
                            'success'
                        )
                    } catch (error) {
                        showToast(`Something went wrong. Try again!`, 'error')
                    }
                    break
                }

                case eventActions.REMOVE:
                    try {
                        await self.deleteCustomerProductListItem(event.item, event.listId)
                        showToast(
                            `1 item removed from ${convertSnakeCaseToSentenceCase(event.listType)}`,
                            'success'
                        )
                        break
                    } catch (error) {
                        showToast(`Something went wrong. Try again!`, 'error')
                    }
            }
        })
    }

    useEffect(() => {
        if (eventQueue.length) {
            processEventQueue()
        }
    }, [customerProductLists])

    const addItemToCustomerProductList = async (item) => {
        const requestBody = {
            productId: item.id,
            priority: 1,
            quantity: item.quantity,
            public: false,
            type: 'product'
        }

        const wishList = customerProductLists.data.find(
            (list) => list.type === customerProductListTypes.WISHLIST
        )
        return await self.createCustomerProductListItem(requestBody, wishList.id)
    }

    const self = useMemo(() => {
        return {
            ...customerProductLists,
            get showLoader() {
                return isLoading
            },

            loaded() {
                return customerProductLists?.data?.length
            },

            getProductListsPerType(type) {
                return customerProductLists?.data.filter((list) => list.type === type) || []
            },

            clearProductLists() {
                // clear out the product lists in context
                setCustomerProductLists({})
            },

            /**
             * Fetches product lists for registered users or creates a new list if none exist
             * @param {string} type type of list to fetch or create
             * @returns product lists for registered users
             */
            async fetchOrCreateProductLists(type) {
                setIsLoading(true)
                // fetch customer productLists
                const response = await api.shopperCustomers.getCustomerProductLists({
                    body: [],
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(false)
                if (isError(response)) {
                    throw new Error(response)
                }

                if (response?.data?.length && response?.data?.some((list) => list.type === type)) {
                    // only set the lists when there is at least one type we need. etc wishlist
                    return setCustomerProductLists(response)
                }

                setIsLoading(true)
                // create a new list to be used later
                const newProductList = await api.shopperCustomers.createCustomerProductList({
                    body: {
                        type
                    },
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(false)
                if (isError(newProductList)) {
                    throw new Error(newProductList)
                }
                // This function does not return an updated customerProductsList so we fetch manually
                await this.getCustomerProductLists()
            },

            /**
             * Fetches product lists for registered users
             * @returns product lists for registered users
             */
            async getCustomerProductLists() {
                setIsLoading(true)
                const response = await api.shopperCustomers.getCustomerProductLists({
                    body: [],
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(false)
                if (isError(response)) {
                    throw new Error(response)
                }

                setCustomerProductLists(response)
                return response
            },

            /**
             * Event queue holds user actions that need to execute on product-lists
             * while the product list information has not yet loaded (eg: Adding to wishlist immedeately after login).
             * @param {object} event Event to be added to queue. event object has properties: action: {item: Object, listId?: string, action: eventActions, listType: CustomerProductListType}
             */
            addActionToEventQueue(event) {
                eventQueue.push(event)
            },

            /**
             * Creates a new customer product list
             * @param {Object} requestBody object containing type property to define the type of list to be created
             */
            async createCustomerProductList(requestBody) {
                setIsLoading(true)
                const response = await api.shopperCustomers.createCustomerProductList({
                    body: requestBody,
                    parameters: {
                        customerId: customer.customerId
                    }
                })

                setIsLoading(true)
                if (isError(response)) {
                    throw new Error(response)
                }

                // This function does not return an updated customerProductsLists so we fetch manually
                await this.getCustomerProductLists()
                return response
            },

            /**
             * Adds an item to the customer's product list.
             * @param {Object} item item to be added to the list.
             * @param {string} listId id of the list to add the item to.
             */
            async createCustomerProductListItem(item, listId) {
                setIsLoading(true)
                const response = await api.shopperCustomers.createCustomerProductListItem({
                    body: item,
                    parameters: {
                        customerId: customer.customerId,
                        listId
                    }
                })

                setIsLoading(false)

                if (isError(response)) {
                    throw new Error(response)
                }

                // This function does not return an updated customerProductsList so we fetch manually
                await self.getCustomerProductLists()
                return response
            }
        }
    }, [customer, customerProductLists, setCustomerProductLists, isLoading])
    return self
}
