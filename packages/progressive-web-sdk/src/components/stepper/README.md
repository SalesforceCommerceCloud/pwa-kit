```js static
// JS import
import Stepper from 'progressive-web-sdk/dist/components/stepper'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/stepper/base';
```

## Example Usage

```jsx
<Stepper label="Quantity" />
```

## Example With Icons

```jsx
<Stepper incrementIcon="plus" decrementIcon="minus" />
```

Icons can be specified for the increase and decrease controls

## Example With Max and Min Values

```jsx
<Stepper initialValue={3} minimumValue={2} maximumValue={6} />
```

You can bound the values of a stepper by passing in the `maximumValue` and/or
`minimumValue` props

## Example With Disabled State

```jsx
<Stepper label="Quantity" disabled />
```

The `disabled` prop allows the rendering component to disable the stepper.


## Example With `useReduxForm`

You need to set `useReduxForm` prop to true to render a stepper that uses `redux-form` to manage its value.
Setting the prop to false, renders a stepper that manages it's value as an internal state and doesn't work with `redux-form`.
Integration with `redux-form` requires wrapping `Stepper` in a form. The
`name` of the input should be set on the `Stepper` in order for
values to be bound to the app state properly. `onIncreaseClick` and `onDecreaseClick` are triggered whenever increase and decrease buttons are clicked. It's up to the developer to decide how to change the quantity using the buttons.

```jsx
const ReduxForm = require('redux-form');
const Redux = require('redux');
const ReactRedux = require('react-redux');
const React = require('react');

// Redux setup
const reducers = {
    form: ReduxForm.reducer,
};
const reducer = Redux.combineReducers(reducers);
const store = Redux.createStore(reducer);


// The form
const DemoForm = (props) => {
    const { handleSubmit } = props
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <Stepper
                    useReduxForm
                    name="quantity"
                    onIncreaseClick={() => {alert('Increase the value')}}
                    onDecreaseClick={() => {alert('Decrease the value')}}
                />
            </form>
        </div>
    );
}

let StateDisplay = (props) => {
    return (
        <div>
            <h3>Form data</h3>
            <pre>
                {JSON.stringify(props.values, null, '  ')}
            </pre>
        </div>
    )
}

StateDisplay = ReactRedux.connect((state)=>{return {values: state.form.demo.values}})(StateDisplay)

const DecoratedForm = ReduxForm.reduxForm({
    form: 'demo', // a unique name for this form
    initialValues: {quantity: 0}
})(DemoForm);


<ReactRedux.Provider store={store}>
    <div style={{display: 'flex', flexDirection: 'column-reverse'}}>
        <div style={{flex: "1 0 auto"}}>
            <DecoratedForm />
        </div>
        <div style={{flex: "1 0 auto"}}>
            <StateDisplay />
        </div>
    </div>
</ReactRedux.Provider>
```

## Getting a reference to the Stepper instance

The Stepper uses a different internal component depending on if the `useReduxForm` prop is true or not. It is not possible to get a reference to this internal component by using the `ref` prop. Instead, you can use the `stepperRef` prop. This prop will be passed down to the internal component. It should be a `callback ref`: a function which will be passed the instance of the component when it is mounted. For more information about `callback refs`, see the [React documentation](https://reactjs.org/docs/refs-and-the-dom.html#callback-refs).

If `useReduxForm` is `false`, the `stepperRef` prop will be passed the instance of the inner `StatefulStepper` component. Normally, the `StatefulStepper` manages the value of the `Stepper` internally. However, you can manually change the value of the `StatefulStepper` after it has been rendered if necessary. Use the `stepperRef` prop to get the instance of the `StatefulStepper` component, then call its `setBoundedValue` function.

```js static
class CustomStepper extends React.Component {
    componentWillReceiveProps(nextProps) {
        if (this.props.initialValue !== nextProps.initialValue) {
            this.stepper.setBoundedValue(nextProps.initialValue)
        }
    }

    render() {
        return (
            <Stepper
                name="quantity"
                initialValue={this.props.initialValue}
                stepperRef={(ref) => { this.stepper = ref }}
            />
        )
    }
}
```

If `useReduxForm` is `true`, the `stepperRef` prop will be passed the instance of the `ReduxForm Field` used within the Stepper. For more information about using `ref`s with the `ReduxForm Field`, see the [ReduxForm documentation](https://redux-form.com/7.2.1/docs/api/field.md/#-code-withref-boolean-code-optional-).