import * as utils from './phone-utils'

test('formats a phone number', () => {
    expect(utils.formatPhoneNumber()).toBeUndefined()
    expect(utils.formatPhoneNumber('')).toEqual('')
    expect(utils.formatPhoneNumber('727')).toEqual('727')
    expect(utils.formatPhoneNumber('727555')).toEqual('(727) 555')
    expect(utils.formatPhoneNumber('7275551234')).toEqual('(727) 555-1234')
})
