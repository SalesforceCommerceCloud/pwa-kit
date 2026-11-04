import {getFreeShippingNudge, openFreeShippingSearch} from './free-shipping-nudge'

const config = {enabled: true, threshold: 35, currency: 'USD', maxGap: 18, priceBuffer: 5}
const basket = {
    basketId: 'basket-1',
    currency: 'USD',
    productTotal: 22,
    productItems: [{productId: 'coffee-1', productName: 'Coffee Beans', quantity: 1}]
}

describe('free shipping nudge rules', () => {
    test('uses merchandise total, computes the gap, and builds a grounded query', () => {
        const nudge = getFreeShippingNudge({...basket, orderTotal: 40}, config)
        expect(nudge).toMatchObject({
            gap: '$13.00',
            minPrice: 13,
            maxPrice: 18,
            productName: 'Coffee Beans'
        })
        expect(nudge.query).toContain('coffee-1')
        expect(nudge.query).toContain('$13.00 and $18.00')
    })
    test.each([
        undefined,
        {...basket, productItems: []},
        {...basket, productTotal: 35},
        {...basket, productTotal: 40},
        {...basket, productTotal: 10},
        {...basket, productTotal: undefined},
        {...basket, currency: 'EUR'},
        {...basket, productTotal: NaN},
        {...basket, shippingTotal: 0, shipments: [{shippingMethod: {id: 'free'}}]}
    ])('does not show for an ineligible cart %#', (value) => {
        expect(getFreeShippingNudge(value, config)).toBeNull()
    })
    test('shows for a small cart when no optional gap cap is configured', () => {
        const {maxGap, ...uncappedConfig} = config
        expect(getFreeShippingNudge({...basket, productTotal: 12.8}, uncappedConfig)).toMatchObject(
            {minPrice: 22.2, maxPrice: 27.2}
        )
    })

    test('rounds currency arithmetic and preserves cents in the search range', () => {
        expect(getFreeShippingNudge({...basket, productTotal: 21.99}, config)).toMatchObject({
            minPrice: 13.01,
            maxPrice: 18.01
        })
    })
    test('requires an explicitly enabled and valid rule', () => {
        expect(getFreeShippingNudge(basket, {...config, enabled: false})).toBeNull()
        expect(getFreeShippingNudge(basket, {...config, threshold: '35'})).toBeNull()
        expect(getFreeShippingNudge(basket, {...config, priceBuffer: -1})).toBeNull()
    })
})

describe('shipping search handoff', () => {
    afterEach(() => {
        delete window.CimulateMessaging
    })
    test('submits once and opens the widget', async () => {
        const sendMessage = jest.fn().mockResolvedValue({outcome: 'success'})
        const toggleWidgetOpen = jest.fn()
        window.CimulateMessaging = {sendMessage, eventHandlers: {components: {toggleWidgetOpen}}}
        await openFreeShippingSearch('Find add-ons')
        expect(sendMessage).toHaveBeenCalledTimes(1)
        expect(sendMessage).toHaveBeenCalledWith('Find add-ons')
        expect(toggleWidgetOpen).toHaveBeenCalledWith(true)
    })
    test('supports the session API fallback', async () => {
        const sendMessage = jest.fn().mockResolvedValue({outcome: 'success'})
        window.CimulateMessaging = {
            eventHandlers: {components: {toggleWidgetOpen: jest.fn()}, session: {sendMessage}}
        }
        await openFreeShippingSearch('Find add-ons')
        expect(sendMessage).toHaveBeenCalledWith('Find add-ons')
    })
    test('reports unavailable APIs and delivery failures', async () => {
        await expect(openFreeShippingSearch('Find add-ons')).rejects.toThrow()
        window.CimulateMessaging = {
            sendMessage: jest.fn().mockResolvedValue({outcome: 'failure'}),
            eventHandlers: {components: {toggleWidgetOpen: jest.fn()}}
        }
        await expect(openFreeShippingSearch('Find add-ons')).rejects.toThrow()
    })
})
