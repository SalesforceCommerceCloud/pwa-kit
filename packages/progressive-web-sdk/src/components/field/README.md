```js static
// JS import
import Field from 'progressive-web-sdk/dist/components/field';
import CardInput from 'progressive-web-sdk/dist/components/card-input';

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/field/base';
```


## Example Usage

### Basic

```jsx
<form>
    <FieldRow>
        <Field
            label="Email"
            idForLabel="email" >

            <input type="email" name="email" required />

        </Field>
    </FieldRow>
</form>
```


### With optional attributes

```jsx
<form>
    <FieldRow>
        <Field
            label="Email"
            idForLabel="email"
            hint="Won't be displayed to other users"
            caption="Must be an @mobify.com email address"
        >

            <input type="email" name="email" placeholder="Placeholder text" required />

        </Field>
    </FieldRow>
</form>
```


### Disabled field styles

```jsx
<form>
    <FieldRow>
        <Field
            label="Email"
            idForLabel="email"
            hint="Won't be displayed to other users"
            caption="Must be an @mobify.com email address"
        >
            <input type="email" name="email" disabled required />
        </Field>
    </FieldRow>

    <FieldRow>
        <Field>
            <select disabled>
                <option>1</option>
                <option>2</option>
            </select>
        </Field>
    </FieldRow>
    <FieldRow>
        <Field label="Sign up to the newsletter?">
            <input type="checkbox" disabled />
        </Field>
    </FieldRow>

    <FieldRow>
        <Field label="Sign up to the newsletter?">
            <input checked type="checkbox" disabled />
        </Field>
    </FieldRow>

    <FieldRow>
        <Field label="Sign up to the newsletter?">
            <input type="radio" disabled />
        </Field>
    </FieldRow>

    <FieldRow>
        <Field label="Sign up to the newsletter?">
            <input checked type="radio" disabled />
        </Field>
    </FieldRow>
</form>
```


### With validation errors

```jsx
<form>
    <FieldRow>
        <Field
            label="Email"
            idForLabel="email"
            error="This is an invalid email address"
        >

            <input type="email" name="email" value="not-an-email-address" required onChange={()=>{}} />

        </Field>
    </FieldRow>
</form>
```

## Redux Select Example

```jsx
<form>
    <FieldRow>
        <Field>
            <select>
                <option>1</option>
                <option>2</option>
            </select>
        </Field>
    </FieldRow>
</form>
```


## Redux Form Example

Integration with `redux-form` requires wrapping each `Field` in a `ReduxForm.Field`
instance which will pass the appropriate props given the current app state. The
`name` of the input should be set on the `ReduxForm.Field` wrapper in order for
values to be bound to the app state properly.

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
            <h3>Order Info</h3>
            <form onSubmit={handleSubmit}>
                <FieldRow>
                    <ReduxForm.Field label="Name" component={Field} name="name">
                        <input type="text" />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Email" component={Field} name="email">
                        <input type="email" />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field
                        component={Field}
                        name="newsletterSignup"
                        label="Sign up to the newsletter?"
                        caption="Get exclusive deals!"
                        type="checkbox"
                    >
                        <input type="checkbox" />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Credit card" component={Field} name="creditCard">
                        <CardInput />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Expiry Date" component={Field} name="expirydate">
                        <ExpiryDate />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Preferred delivery time" component={Field} name="deliveryTime">
                        <select>
                            <option value="">Select</option>
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                        </select>
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Select Multiple" component={Field} name="select-multiple">
                        <select multiple>
                            <option value="one">one</option>
                            <option value="two">two</option>
                            <option value="three">three</option>
                            <option value="four">four</option>
                            <option value="five">five</option>
                        </select>
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Delivery address" component={Field} name="address">
                        <textarea />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <p>Delivery options</p>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Ground mail" component={Field} type="radio" name="deliveryOption" value="ground">
                        <input type="radio" />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <ReduxForm.Field label="Air mail" component={Field} type="radio" name="deliveryOption" value="air">
                        <input type="radio" />
                    </ReduxForm.Field>
                </FieldRow>

                <FieldRow>
                    <Button type="submit">Submit</Button>
                </FieldRow>
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

const validate = (values) => {
    const errors = {}

    if ((values.email || '').search(/@mobify.com$/) < 0) {
        errors.email = "Must be a @mobify.com email address"
    }

    return errors
}

const DecoratedForm = ReduxForm.reduxForm({
    form: 'demo', // a unique name for this form
    validate: validate
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
