import reducer from './reducer'
import * as actions from './actions'

test(`Home reducer`, () => {
    const initial = reducer(undefined, {type: 'unknown'})
    expect(initial.toJS()).toEqual({})
    const next = reducer(initial, actions.updateHomeUIState({foo: 'bar'}))
    expect(next.toJS()).toEqual({foo: 'bar'})
})
