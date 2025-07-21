/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import Cookies from 'js-cookie'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {initDataCloudSdk} from '@salesforce/cc-datacloud-typescript'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useUsid, useCustomerType, useDNT} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

export class DataCloudApi {
    constructor({siteId, appSourceId, tenantId, dnt}) {
        this.siteId = siteId
        this.sdk = initDataCloudSdk(tenantId, appSourceId)
        this.dnt = dnt
    }

    /**
     * Constructs the base event object with the necessary data required
     * for every event sent to Data Cloud.
     *
     * @param {object} args - The arguments containing event-specific details
     * @returns {object} - The base event object
     */
    _constructBaseEvent(args) {
        return {
            guestId: args.guestId,
            siteId: this.siteId,
            sessionId: args.sessionId,
            deviceId: args.customerId || args.guestId,
            dateTime: new Date().toISOString(),
            ...(args.customerId && {customerId: args.customerId}), // Can remove the conditionality after the hook -> Promise is changed in future PWA release
            ...(args.customerNo && {customerNo: args.customerNo})
        }
    }

    /**
     * Constructs a user details object for use in identity events.
     * Includes information such as guest/registered status, first/last name, and other profile data.
     *
     * @param {object} args - The arguments containing user profile details (isGuest, firstName, lastName, etc.).
     * @returns {object} - The user details object for identity events.
     */
    _constructUserDetails(args) {
        return {
            isAnonymous: args.isGuest,
            firstName: args.firstName,
            lastName: args.lastName
        }
    }

    /**
     * Generates the event details object required for sending an
     * event to Data Cloud.
     *
     * @param {string} eventType - The type of event being recorded (e.g
     * "identity", "userEngagement", "contactPointEmail")
     * @param {string} category - The category of the event, representing
     * its broader grouping (e.g. "Profile", "Engagement")
     * @returns {object} - The event details object
     */
    _generateEventDetails(eventType, category, email = '') {
        return {
            eventId: crypto.randomUUID(),
            eventType: eventType,
            category: category,
            ...(eventType === 'contactPointEmail' && {email})
        }
    }

    /**
     * Constructs an object containing the product Id.
     *
     * This method extracts and returns the appropriate product Id based on
     * the product type.
     *
     * @param {object} product - The product object
     * @returns {object} - An object containing the resolved product Id
     */
    _constructDatacloudProduct(product) {
        // Return the product SKU in the following priority order:
        // 1. id if available - SKU of the Variant Product
        // 2. productId if available - SKU of product hits within a category
        // 3. masterId - SKU of the Master Product
        return {
            id: product?.id ?? product?.productId ?? product?.master?.masterId
        }
    }
    /**
     * Constructs the base search result object with relevant search
     * metadata.
     *
     * @param {object} searchParams - The searchParams object
     * @returns {object} - The base search result object
     */
    _constructBaseSearchResult(searchParams) {
        return {
            searchResultTitle: searchParams.q,
            searchResultPosition: searchParams.offset,
            searchResultPageNumber:
                searchParams.limit != 0 ? searchParams.offset / searchParams.limit + 1 : 1
        }
    }

    /**
     * Concatenates multiple event objects into a single object by merging their properties.
     * Later objects in the argument list will override properties from earlier ones if there are conflicts.
     *
     * @param {...object} events - One or more event objects to be merged.
     * @returns {object} - The merged event object containing all properties from the input objects.
     */
    _concatenateEvents = (...events) => ({...events.reduce((acc, obj) => ({...acc, ...obj}), {})})

    /**
     * Constructs the party identification event object for a user.
     * This includes identifiers and metadata for the user, such as guest or registered customer IDs.
     *
     * @param {object} args - The arguments containing user identification details (isGuest, guestId, customerId).
     * @returns {object} - The party identification event object with required fields for the schema.
     */
    _constructPartyIdentification(args) {
        const partyIdentifier = args.isGuest ? args.guestId : args.customerId
        const partyIdType = args.isGuest ? 'CC_USID' : 'CC_REGISTERED_CUSTOMER_ID'

        return {
            party: partyIdentifier,
            userId: partyIdentifier,
            IDName: partyIdType,
            IDType: partyIdType,
            partyIdentificationId: partyIdentifier,
            internalOrganizationId: this.siteId,
            creationEventId: crypto.randomUUID()
        }
    }

    /**
     * Creates standard events (identity, party identification, contact point email)
     * that are common across all send methods
     */
    _createStandardEvents(args, additionalIdentityProps = {}) {
        const baseEvent = this._constructBaseEvent(args)
        const userDetails = this._constructUserDetails(args)

        const identityProfile = this.dnt
            ? {}
            : this._concatenateEvents(
                  baseEvent,
                  this._generateEventDetails('identity', 'Profile'),
                  userDetails,
                  additionalIdentityProps
              )

        const partyIdentification = this.dnt
            ? {}
            : this._concatenateEvents(
                  baseEvent,
                  this._generateEventDetails('partyIdentification', 'Profile'),
                  this._constructPartyIdentification(args)
              )

        const contactPointEmail = args.email
            ? this._concatenateEvents(
                  baseEvent,
                  this._generateEventDetails('contactPointEmail', 'Profile', args.email)
              )
            : null

        return {baseEvent, identityProfile, partyIdentification, contactPointEmail}
    }

    _handleApiError(err) {
        if (err?.response?.status === 400) {
            logger.warn(
                '[DataCloudApi] 400 Bad Request: Check your Data Cloud configuration (appSourceId, tenantId) and event payload.',
                {
                    namespace: 'use-datacloud._handleApiError',
                    additionalProperties: {error: err?.response}
                }
            )
        } else {
            logger.error('[DataCloudApi] Error sending Data Cloud event', {
                namespace: 'use-datacloud._handleApiError',
                additionalProperties: {error: err?.response}
            })
        }
    }

    /**
     * Constructs the interaction object and sends it to Data Cloud
     */
    _sendInteraction(standardEvents, specificEvents) {
        const {identityProfile, partyIdentification, contactPointEmail} = standardEvents

        const interaction = {
            events: [
                ...(!this.dnt ? [identityProfile, partyIdentification] : []),
                ...(contactPointEmail ? [contactPointEmail] : []),
                ...specificEvents
            ]
        }

        return this.sdk
            .webEventsAppSourceIdPost(interaction)
            .catch((err) => this._handleApiError(err))
    }

    /**
     * Maps search results to DataCloud product format
     */
    _mapSearchResultsToProducts(searchResults) {
        return searchResults?.hits?.map((product) => this._constructDatacloudProduct(product)) || []
    }

    /**
     * Sends a `page-view` event to Data Cloud.
     *
     * This method records an `userEnagement` event type to track which page the shopper has viewed.
     *
     * @param {string} path - The URL path of the page that was viewed
     * @param {object} args - Additional metadata for the event
     */
    async sendViewPage(path, args) {
        const standardEvents = this._createStandardEvents(args, {sourceUrl: path})

        const specificEvents = [
            this._concatenateEvents(
                standardEvents.baseEvent,
                this._generateEventDetails('userEngagement', 'Engagement'),
                {
                    interactionName: 'page-view',
                    sourceUrl: path
                }
            )
        ]

        return this._sendInteraction(standardEvents, specificEvents)
    }

    /**
     * Sends a `catalog-object-view-start` event to Data Cloud.
     *
     * This method records a `catalog` event type to track when a shopper
     * views the details of a product (e.g. a Product Detail Page).
     *
     * @param {object} product - The product being viewed
     * @param {object} args - Additional metadata for the event
     */
    async sendViewProduct(product, args) {
        const standardEvents = this._createStandardEvents(args)

        const specificEvents = [
            this._concatenateEvents(
                standardEvents.baseEvent,
                this._generateEventDetails('catalog', 'Engagement'),
                this._constructDatacloudProduct(product),
                {
                    type: 'Product',
                    webStoreId: 'pwa',
                    interactionName: 'catalog-object-view-start'
                }
            )
        ]

        return this._sendInteraction(standardEvents, specificEvents)
    }

    /**
     * Sends a `catalog-object-impression` event to Data Cloud.
     *
     * This method records a `catalog` event type and represents a single
     * page of product impressions (e.g. a Product List Page).
     *
     * One event is sent for each product on the page.
     *
     * @param {object} searchParams - The searchParams object
     * @param {object} category - The category object
     * @param {object} searchResults - The searchResults object
     * @param {object} args - Additional metadata for the event
     */
    async sendViewCategory(searchParams, category, searchResults, args) {
        const standardEvents = this._createStandardEvents(args)

        const specificEvents = this._mapSearchResultsToProducts(searchResults).map((product) => {
            return this._concatenateEvents(
                standardEvents.baseEvent,
                this._generateEventDetails('catalog', 'Engagement'),
                this._constructBaseSearchResult(searchParams),
                {
                    id: product.id,
                    type: 'Product',
                    webStoreId: 'pwa',
                    categoryId: category.id,
                    interactionName: 'catalog-object-impression'
                }
            )
        })

        return this._sendInteraction(standardEvents, specificEvents)
    }

    /**
     * Sends a `catalog-object-impression` event to Data Cloud with
     * additional search result data.
     *
     * This method records a `catalog` event type when a shopper completes a
     * search, logging an impression of the products displayed in the search
     * results.
     *
     * @param {object} searchParams - The searchParams object
     * @param {object} searchResults - The searchResults object containing an
     * array of product impressions
     * @param {object} args - Additional metadata for the event
     */
    async sendViewSearchResults(searchParams, searchResults, args) {
        const standardEvents = this._createStandardEvents(args)

        const specificEvents = this._mapSearchResultsToProducts(searchResults).map((product) => {
            return this._concatenateEvents(
                standardEvents.baseEvent,
                this._generateEventDetails('catalog', 'Engagement'),
                this._constructBaseSearchResult(searchParams),
                {
                    searchResultId: crypto.randomUUID(),
                    id: product.id,
                    type: 'Product',
                    webStoreId: 'pwa',
                    interactionName: 'catalog-object-impression'
                }
            )
        })

        return this._sendInteraction(standardEvents, specificEvents)
    }

    /**
     * Sends a `catalog-object-impression` event to Data Cloud with
     * additional recommendation data.
     *
     * This method records a `catalog` event type when a shopper views a recommendation,
     * logging an impression of the products displayed in the recommendation.
     *
     * @param {object} recommenderDetails - Metadata about the recommendation source
     * @param {array} products - List of recommended products
     * @param {object} args - Additional metadata for the event
     */
    async sendViewRecommendations(recommenderDetails, products, args) {
        const standardEvents = this._createStandardEvents(args)

        const specificEvents = products.map((product) => {
            return this._concatenateEvents(
                standardEvents.baseEvent,
                this._generateEventDetails('catalog', 'Engagement'),
                {
                    id: product.id,
                    type: 'Product',
                    webStoreId: 'pwa',
                    interactionName: 'catalog-object-impression',
                    personalizationId: recommenderDetails.recommenderName, //* The identifier of the personalization (e.g., recommendation), provided by the personalization service provider, that led to the event.
                    personalizationContextId: recommenderDetails.__recoUUID //* The identifier, provided by the personalization service provider, of the specific content (e.g., product) associated with this event.
                }
            )
        })

        return this._sendInteraction(standardEvents, specificEvents)
    }
}

/**
 * Custom hook for sending PWA Kit events to Data Cloud.
 *
 * This hook provides methods to track various user interactions, such as
 * page views, product views, category views, search impressions, and recommendations.
 *
 * @returns {object} An object containing methods for sending different Data Cloud events
 */
const useDataCloud = () => {
    const {getUsidWhenReady} = useUsid()
    const {isRegistered} = useCustomerType()
    const {data: customer} = useCurrentCustomer()
    const {site} = useMultiSite()
    const {effectiveDnt} = useDNT()
    const sessionId = Cookies.get('sid')

    // If Do Not Track is enabled, then the following fields are replaced with '__DNT__'
    const getEventUserParameters = async () => {
        const usid = await getUsidWhenReady()
        return {
            isGuest: isRegistered ? 0 : 1,
            customerId: effectiveDnt ? '__DNT__' : customer?.customerId,
            customerNo: effectiveDnt ? '__DNT__' : customer?.customerNo,
            guestId: effectiveDnt ? '__DNT__' : usid,
            deviceId: effectiveDnt ? '__DNT__' : customer?.customerId || usid,
            sessionId: effectiveDnt ? '__DNT__' : sessionId,
            firstName: customer?.firstName,
            lastName: customer?.lastName,
            email: !effectiveDnt ? customer?.email : undefined
        }
    }

    // Grab Data Cloud configuration values. Only initialize the SDK if config is present.
    const {
        app: {dataCloudAPI: config = {}}
    } = getConfig()

    const {appSourceId, tenantId} = config

    const dataCloud = useMemo(() => {
        if (!appSourceId || !tenantId) return null
        return new DataCloudApi({
            siteId: site.id,
            appSourceId,
            tenantId,
            dnt: effectiveDnt
        })
    }, [site, appSourceId, tenantId, effectiveDnt])

    // If Data Cloud config is missing, return no-op async functions for all event methods (SDK will not be initialized)
    if (!appSourceId || !tenantId) {
        const noop = async () => {}
        return {
            sendViewPage: noop,
            sendViewProduct: noop,
            sendViewCategory: noop,
            sendViewSearchResults: noop,
            sendViewRecommendations: noop
        }
    }

    return {
        async sendViewPage(...args) {
            const userParameters = await getEventUserParameters()
            return dataCloud.sendViewPage(...args.concat(userParameters))
        },
        async sendViewProduct(...args) {
            const userParameters = await getEventUserParameters()
            return dataCloud.sendViewProduct(...args.concat(userParameters))
        },
        async sendViewCategory(...args) {
            const userParameters = await getEventUserParameters()
            return dataCloud.sendViewCategory(...args.concat(userParameters))
        },
        async sendViewSearchResults(...args) {
            const userParameters = await getEventUserParameters()
            return dataCloud.sendViewSearchResults(...args.concat(userParameters))
        },
        async sendViewRecommendations(...args) {
            const userParameters = await getEventUserParameters()
            return dataCloud.sendViewRecommendations(...args.concat(userParameters))
        }
    }
}

export default useDataCloud
