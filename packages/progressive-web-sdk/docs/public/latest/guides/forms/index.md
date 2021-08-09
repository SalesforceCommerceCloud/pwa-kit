In this article, we dive into how to handle your application's forms. We cover how to use the Redux Form library to validate forms, submit forms, and supply initial values, through several hands-on examples. In addition, we discuss debugging, user experience, performance, and analytics, as they relate to forms.

## The Redux Form library

When building forms with the Progressive Web SDK, we recommend using the [Redux Form](http://redux-form.com/) library to manage form state and to handle validation, although other methods are available if you prefer.

Redux Form works alongside the form components included in the SDK: [CardInput](../../components/#!/CardInput), [FieldSet](../../components/#!/FieldSet), [FieldRow](../../components/#!/FieldRow), [Field](../../components/#!/Field), and [Stepper](../../components/#!/Stepper).

The library has its own [Field component](http://redux-form.com/7.2.1/docs/api/Field.md/) which is used to connect the value of the field to its state. You can use its `component` prop to determine what it renders as that field. You should use this prop to render the SDK's `Field` component, like so:

```jsx
<ReduxForm.Field
    component={Field}
    label="First Name" // The Field component will render this label
    name="first-name" // Redux form needs the name to be able to connect this field to the store
>
    <input type="text" /> // The Field component expects the input as a single child
</ReduxForm.Field>
```

This will render an SDK `Field` that is connected to the store. For more information, see the full example in our documentation for the [Field component](../../components/#!/Field).

## Validating forms

Redux Form offers two kinds of validation: [synchronous or sync validation](http://redux-form.com/7.2.1/examples/syncValidation/), and [submit validation](http://redux-form.com/7.2.1/examples/submitValidation/).

### Sync validation

Sync validation occurs when the form first mounts and whenever the user changes a value within the form. It **does not run** when the user submits the form. If the value within a field fails in sync validation, an error is shown for that field, and the form submission is disabled. The SDK's `Field` component automatically works with Redux Form's validation and displays these errors. By default, errors are hidden for a field if the user hasn't yet interacted with the field, or if they are currently editing the field. This can be configured using the [Field component's props](../../components/#!/Field). [Redux Form's documentation](http://redux-form.com/7.2.1/examples/syncValidation/) explains how to add sync validation to your form.

You may run into a situation where you have a form with different sections that need to be validated separately. For example, you might have a payment form with multiple payment methods such as credit card and gift card. You only want to validate the credit card form if the credit card payment option is selected.

In these cases, it's often best to break the form up into two smaller forms. This makes the logic you need to write for validation much simpler. When you need to submit the forms, you can determine which data should be submitted based on which payment option is used.

### Submit validation

Submit validation occurs when the form is submitted. To use submit validation, your `submit` action must return a `Promise` rejected with a `SubmissionError`. Redux Form will use the `SubmissionError` to show errors on the fields and the form itself.

Because `SubmissionError`s are related to the user interface, we recommend using `SubmissionError`s within the UI action, rather than within the connector command. For an example of how this might work, see our [Form Submission Example](#form-submission-example).

## Submitting forms

One of the most important steps when submitting a form is ensuring that you're sending it all of the correct data. To get the data you need for the form submission, we suggest using selectors within the `submit` command to get the data from the state. This is easier than trying to pass all of the data that you need to the `submit` command, especially when that data may come from several different sources.

### Form submission example

```js
// packages/pwa/app/pages/login/index.jsx
<form onSubmit={handleSubmit(submit)}>

// packages/pwa/app/pages/login/actions.js
import { SubmissionError } from 'redux-form'
import { getLoginFormValues } from '../../pages/login/selectors.js'

export const submit = () => (dispatch, getState) => {
    const selector = createPropsSelector({
        formValues: getLoginFormValues
    })

    const data = selector(getState())

    const {
        username,
        password
        } = data.formValues

    return dispatch(login(username, password))
        .then(() => {
            // Handle the successful form submission
        })
        .catch((errors) => new SubmissionError(errors))
}


// packages/pwa/app/actions.js
export const login = (username, password) => (dispatch, __, {connector}) => {
    connector.login(username, password).then((data) => {
        // successful login
    })
}

// package/pwa/app/pages/login/selectors.js
import {getForm} from '../../selectors.js'

export const getLoginForm = createSelector(
    getForm,
    ({loginForm}) => loginForm
)

export const getLoginFormValues = createSelector(
    getLoginForm,
    ({values}) => values
)
```

## Initial values

Redux Form's documentation offers [examples](http://redux-form.com/7.2.1/examples/initializeFromState/) for supplying initial values into fields. To complement those, we've included some examples here, showing how to do this in the context of a Progressive Web App (PWA).

Below are two examples of forms that use initial values in two distinct ways: the first demonstrates how to set static initial values, and the second example demonstrates how to use selectors to provide the initial values dynamically.

```js
// web/app/containers/my-form/container.jsx
import React from 'react'
import PropTypes from 'prop-types'
import * as ReduxForm from 'redux-form'
import {connect} from 'react-redux'
import FormFields from './partials/form-fields.jsx'

class MyForm extends React.Component {
    constructor(props) { /* ... */ }
    onSubmit(values) { /* ... */ }
    render() {
        return (<FormFields />)
    }
}

MyForm.propTypes = { /* ... */ }

const mapStateToProps = createPropsSelector({/* ... */})
const mapDispatchToProps = { /* ... */ }

// This is where we pass in our static initial values. This object's
// keys reference a field's name prop, and the object values
// refer to the field's initial values
const MyFormReduxForm = ReduxForm.reduxForm({
    form: 'my-form',
    initialValues: {
        textFieldName: 'Text Field Initial Value',
        checkboxFieldName: true,
        selectFieldName: 'Select Field\'s Initial Option Value'
    }
})(MyForm)
export default connect(mapStateToProps, mapDispatchToProps)(MyFormReduxForm)
```

There's a pattern that's used in PWA engineering, to help simplify the syncing between a form's initial values in relation to other aspects of the UI. Consider the following example, where a checkout payment form uses the same data that the user submitted to a shipping form earlier in the checkout process:

```js
// web/app/containers/my-form/container.jsx
import React from 'react'
import PropTypes from 'prop-types'
import * as ReduxForm from 'redux-form'
import {connect} from 'react-redux'
import Field from 'progressive-web-sdk/dist/components/field'
import FieldRow from 'progressive-web-sdk/dist/components/field-row'

// We import a shared form partial that is used in both the
// shipping form, and the payment form. It's format can be thought
// of as similar as the fields in the previous form, above.
import AddressFields from './partials/address-fields.jsx'

// Here we import the payment form selector that fetches the
// initial form values that the user already submitted during
// the shipping part of the checkout process.
import {getPaymentFormInitialValues} from '../../../store/checkout/billing/selectors'

class PaymentForm extends React.Component {
    constructor(props) { /* ... */ }
    onSubmit(values) { /* ... */ }
    render() {
        return (
            <div>
                <AddressFields />
                {/* and so on... */}
            </div>
        )
    }
}

PaymentForm.propTypes = { /* ... */ }

// Note this: instead of passing in static values, we fetch the
// values from the Redux state. This way, we are able to use the
// same values that the user submitted to the shipping form
// earlier in the checkout process.
const mapStateToProps = createPropsSelector({
    initialValues: getPaymentFormInitialValues
})

const mapDispatchToProps = { /* ... */ }
const PaymentFormReduxForm = ReduxForm.reduxForm( /* ... */)(PaymentForm)
export default connect(mapStateToProps, mapDispatchToProps)(PaymentFormReduxForm)
```

The above example is a common use case in ecommerce, but the possibilities don't end there. Other possibilities include filling-in a form's fields based on user interactions, such as when a user selects from a product's options before submitting an add to cart action. In another common use case, a guest user may have empty form fields, whereas a logged-in user would have pre-filled form fields.

## Debugging forms

### Silent submission errors

You might be experiencing this issue if:
* When you `submit` your form, nothing happens
* In [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en), you can see that your form submission failed but you don't see any errors shown

Redux Form expects your `submit` function to return a Promise. It uses the Promise
you return to determine if your submission has succeeded. If the `onSubmit`
function throws an exception, your submission has failed. However, one side
effect is that Redux Form can end up silently swallowing exceptions that
occur in your `onSubmit` function. When this happens, start by looking for any
exceptions that could be thrown inside your `onSubmit` function. It can be
helpful to step through this function line by line to determine the exact issue.
You could also wrap the code inside your `onSubmit` function in a
`try {} catch(e) {}` so you can see the exception thrown inside the `catch`.

### Missing hidden inputs

You might be experiencing this issue if:
* You're working with an HTML form
* Form submission is failing even when all of the fields are filled out

HTML forms often use hidden inputs to send extra data to the backend during a
form submission. This extra data is sometimes required for the form, to submit correctly.
In this case, you should check to make sure your form is
including all of these hidden input values in the submission. A good way to
check this is to compare the network requests for form submissions with the
desktop site. If the desktop site's submission includes data that isn't in your
submission, it's likely due to a missing hidden input.

Thanks to Redux Form, you do **not** need to render these hidden inputs within
the form itself. Instead, you can add their values to the form submission
request when you send it.

```js
// packages/pwa/app/pages/login/actions.js
import { SubmissionError } from 'redux-form'
import { getLoginFormValues } from '../../pages/login/selectors.js'

export const submit = () => (dispatch, getState) => {
    const selector = createPropsSelector({
        formValues: getLoginFormValues,
        hiddenInputs: getHiddenInputs
    })

    const data = selector(getState())

    return dispatch(registerCustomer({...data.formValues, ...data.hiddenInputs}))
        .then(() => {
            // Handle the successful form submission
        })
        .catch((errors) => new SubmissionError(errors))
}

// packages/pwa/app/action.js
export const registerCustomer = (data) => (dispatch, __, {connector}) => {
    connector.registerCustomer(data).then((data) => {
        // successful login
    })
}


// packages/connector/src/index.js
// over-riding default registerCustomer
registerCustomer(data) {
    return this.agent
        .post(`/mobify/proxy/base/register`)
        .send(data)
        .then((res) => {
            // successful response
        })
}

```

### Incorrect encoding type

You might be experiencing this issue if you get server errors when you submit your form. This is only applicable for projects using a [scraping connector](../../integrations/commerce-integrations/#implementing-a-custom-scraping-connector).

Form endpoints usually expect data to be formatted in a particular
way. It's important to ensure that the data that you're sending is using the
correct `Content-Type` header so the endpoint is able to use the data you're
sending.

When using an HTML form, check which `Content-Type` the desktop form is
using. In most cases, the `Content-Type` used will be
`application/x-www-form-urlencoded`. You would have to configure the `SuperAgent`'s request.
```js
this.agent.post('/user')
    .type('form')
    .send({ name: 'tj' })
    .send({ pet: 'tobi' })
    .then((res) => {
        // successful response
    })
```

When using an API form endpoint, take a look at the documentation pf the API to determine
the correct encoding. In most cases, the `Content-Type` used will be
`application/json`. This is the default `Content-Type` used in the `SuperAgent`'s post request.


## User experience

### Contextual keyboard

We strongly recommend always using the correct input types and contextual
keyboards for your form fields. Some examples of the correct input types
include:
* `type="tel"` for number-only fields
* The postal/zip code field should be numeric if your shipping is restricted to the US.
  Alternatively, if your site visitor is shipping to the U.K.
  or to Canada, you'll need to allow alphabetic characters.
* `type="email"` for email address fields
* `type="search"` for search fields

### Autocomplete attributes

Browser autofill can help users fill out forms much faster, but it's not always
accurate. The browser has to do a lot of work to infer what each field is, and
the correct data to enter. However, it's possible to add
`autocomplete` attributes to your `input` elements to fix this. This will allow you to
specify the data you're expecting for each field. We recommend using `autocomplete`
attributes for fields in a checkout form.

[You can find the full list of autocomplete attributes here](https://developers.google.com/web/updates/2015/06/checkout-faster-with-autofill).

### Pasting passwords

Forbidding users to paste values into the password field makes form entry slower,
and it also breaks password managers. The user should always be able to
paste into the password field.

## Performance

One common performance pitfall when using forms is re-rendering a large section
of the app whenever the value of a form changes. This can make the app feel
unresponsive. The culprit is often caused by including selectors for form values in the
`mapStateToProps` of your component. In general, you should *not* need to include
these selectors, as Redux Form will handle rendering the values inside the
fields. It only becomes necessary when you want to display form values somewhere
else in the component, outside of the input. Whenever possible, try to design
your forms in such a way that this isn't necessary.

## Analytics

[Analytics Integrations](../../analytics/analytics-integrations-overview/) makes it easy to instrument events for all form fields. This is done through the [DOM Tracker](../../analytics/analytics-integrations-overview/#the-dom-tracker-and-performance-tracker), which detects UI interactions.

The following example shows how to instrument a DOM element to trigger an event for forms:

```js
import Field from 'progressive-web-sdk/dist/components/field'

<form id={SIGN_IN_FORM_NAME} data-analytics-name="login">
    <FieldRow>
        <ReduxForm.Field component={Field} name="username" label="Email">
            <input type="email" data-analytics-name="email">
        </ReduxForm.Field>
    </FieldRow>
    <FieldRow>
        <ReduxForm.Field component={Field} name="password" label="Password">
            <input type="password" data-analytics-name="password" />
        </ReduxForm.Field>
    </FieldRow>
</form>

// Creating the Redux form
const ReduxSignInForm = reduxForm({
    form: SIGN_IN_FORM_NAME
})(SignInForm)
```

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>