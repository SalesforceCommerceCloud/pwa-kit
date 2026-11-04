import React from 'react'
import {IntlProvider} from 'react-intl'
import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import CartNudge from './cart-nudge'

let mockBasket
let mockLoading
const mockToast = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: () => ({data: mockBasket, isLoading: mockLoading})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({useToast: () => mockToast}))
const config = {enabled: true, threshold: 35, currency: 'USD', maxGap: 18, priceBuffer: 5}
const props = {
    config,
    siteId: 'RefArch',
    onDismiss: jest.fn(),
    fallback: <div>Welcome fallback</div>
}
const view = () => (
    <IntlProvider locale="en-US">
        <CartNudge {...props} />
    </IntlProvider>
)

beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    mockLoading = false
    mockBasket = {
        basketId: 'basket-1',
        currency: 'USD',
        productTotal: 22,
        productItems: [{productId: 'coffee-1', productName: 'Coffee Beans', quantity: 1}]
    }
    window.CimulateMessaging = {
        sendMessage: jest.fn().mockResolvedValue({outcome: 'success'}),
        eventHandlers: {components: {toggleWidgetOpen: jest.fn()}}
    }
})
afterEach(() => {
    delete window.CimulateMessaging
})
test('shows the live cart gap and only submits the search after click', async () => {
    render(view())
    expect(screen.getByRole('button', {name: /\$13.00 away.*Coffee Beans/})).toBeInTheDocument()
    expect(window.CimulateMessaging.sendMessage).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: /\$13.00 away/}))
    await waitFor(() => expect(window.CimulateMessaging.sendMessage).toHaveBeenCalledTimes(1))
    expect(window.CimulateMessaging.sendMessage.mock.calls[0][0]).toContain('$13.00 and $18.00')
    expect(window.CimulateMessaging.eventHandlers.components.toggleWidgetOpen).toHaveBeenCalledWith(
        true
    )
})
test('dismisses without sending, and stays dismissed for the same cart state', () => {
    const {unmount} = render(view())
    fireEvent.click(screen.getByRole('button', {name: 'Dismiss free-shipping suggestion'}))
    expect(window.CimulateMessaging.sendMessage).not.toHaveBeenCalled()
    unmount()
    render(view())
    expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
})
test('reacts to cart total changes and stops at the threshold', () => {
    const {rerender} = render(view())
    mockBasket = {...mockBasket, productTotal: 30}
    rerender(view())
    expect(screen.getByRole('button', {name: /\$5.00 away/})).toBeInTheDocument()
    mockBasket = {...mockBasket, productTotal: 35}
    rerender(view())
    expect(screen.queryByTestId('shopper-agent-welcome')).not.toBeInTheDocument()
    expect(screen.getByText('Welcome fallback')).toBeInTheDocument()
})
test('does not flash a welcome while the live cart is loading', () => {
    mockLoading = true
    render(view())
    expect(screen.queryByText('Welcome fallback')).not.toBeInTheDocument()
})
test('shows an actionable error when message delivery fails', async () => {
    window.CimulateMessaging.sendMessage.mockRejectedValue(new Error('offline'))
    render(view())
    fireEvent.click(screen.getByRole('button', {name: /\$13.00 away/}))
    await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({status: 'error'}))
    )
})
