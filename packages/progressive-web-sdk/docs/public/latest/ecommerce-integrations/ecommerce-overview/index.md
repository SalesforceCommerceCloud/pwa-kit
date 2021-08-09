<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> Projects generated <em>after</em> 2019 do not use the Integration Manager because it has been replaced with our <a href="../../integrations/commerce-integrations/">Commerce Integrations</a> technology.
  </p>

  <p>
     For anyone working on projects that were generated <em>before</em> 2019, we've left the Integration Manager documentation here in case you still need to refer to it.
  </p>
</div>

The Integration Manager provides an abstraction layer between your progressive
web app and the source of its ecommerce data. This data can come from a
dedicated ecommerce platform, a desktop website, or a custom API.

To give you a head start on building your app, we've included ready-made
connectors that already know how to fetch and update data using popular
ecommerce platforms. We also make it easy to create your own custom connector
for any data source.

The Integration Manager handles fetching and updating ecommerce data in a
standard way without forming any dependencies on any particular ecommerce
platform. This gives you the flexibility to connect your app to a new platform
in the future without making extensive changes to your code.

## How does it work?

The Integration Manager introduces a small "detour" into the standard data flow
for Redux actions. It all starts when a React component in your application
dispatches a Redux action that is local to the component. After handling
user-interface tasks like starting a spinner or opening a modal, the action can
dispatch an Integration Manager command. (Integration Manager commands are also
Redux actions.) The Integration Manager delegates the execution of the command
to the currently configured connector. The connector executes the command in a
way that is compatible with the ecommerce data source that it is built for. That
means that the same command will be interpreted differently by different
connectors. When the command has completed, it dispatches another type of Redux
action called a result action. The data returned by the result is merged into
the Redux store by reducers that are provided by the Integration Manager. At
this point, the standard data flow for Redux actions resumes, and the
application's components are notified about any changes to the Redux store that
may require them to re-render.

The diagram below shows how the Integration Manager fits into the architecture
of your progressive web application.

[![Integration Manager
architecture](https://docs.mobify.com/progressive-web/assets/images/mobify-backend-analyticsmanager_complexdiagram_june2017_1085.png)](https://docs.mobify.com/progressive-web/assets/images/mobify-backend-analyticsmanager_complexdiagram_june2017_1085.png)

<figcaption>
  <small>(Click the image for a larger version.)</small>
</figcaption>

## Dispatching commands

When using the Integration Manager in front end code (UI, components, etc.) you
dispatch operations by importing the appropriate command and then dispatching
it. There are often UI-level behaviors that need to be managed as part of
dispatching the core action and so a common pattern when using the Integration
Manager is to create an "event handler" action to connect to the UI and then
dispatching the appropriate Integration Manager command from within that. This
pattern allows the UI to present a spinner for the duration of the Integration
Manager command, for example. The Integration Manager commands never modify the
UI directly (or through UI-related actions) and so that must be handled in the
event handler actions which are themselves Redux thunk actions.

<div class="c-callout">
  <p>
    <strong>What's a thunk action?</strong> A thunk action is a function is dispatched as an action by the <a href="https://github.com/reduxjs/redux-thunk">Redux Thunk</a> middleware. The middleware provides two parameters
to the thunk: the <code>dispatch</code> function from Redux for dispatching other actions and a
<code>getState</code> function that returns a reference to the Redux state object. Thunks
are not pure functions because they perform the side effects of dispatching actions and/or making network requests.
  </p>
</div>

Dispatching a command is only half of the equation though. Once the command is
dispatched you'll want to be notified when the command completes. Integration
Manager commands always return a
[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
which can be used to execute some behaviour when the command completes. This
also provides a mechanism for handling error states that the Integration Manager
and configured connector may encounter (network errors, server errors, etc). A
complete example below shows how the UI would connect to an event handler
action, dispatch a command to do the "real work", and then clean up when the
command completes.

```js
// product-details/index.jsx
import {submitCartForm} from './actions'

class ProductDetails({
    title,
    image,
    price
}) => (
    <form onSubmit={handleSubmit(submitCartForm)}>
        ... render title, image, price...
    </form>
)

mapStateToProps = createStructuredSelector({
    title: getSelectedProductTitle,
    image: getSelectedProductImage,
    price: getSelectedProductPrice
})

mapDispatchToProps = {
    submitCartForm
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProductDetails)

// product-details/actions.js
import {addNotification} from 'progressive-web-sdk/dist/store/notifications/actions'
import IntegrationManager from 'mobify-integration-manager/dist/'
import {showSpinner, hideSpinner} from '../app/actions'
import {PRODUCT_DETAILS_ITEM_ADDED_MODAL} from './constants'

// A thunk action
export const submitCartForm = (formValues) => (dispatch) => {
    const productId = formValues.product_id
    const quantity = formValues.quantity

    dispatch(showSpinner())
    dispatch(IntegrationManager.cart.addToCart(productId, quantity))
        .then(() => {
            dispatch(openModal(PRODUCT_DETAILS_ITEM_ADDED_MODAL))
        })
        .catch((error) => {
            dispatch(addNotification({
                content: 'We couldn\'t add this item to your cart',
                id: 'add-to-cart-error',
                showRemoveButton: true)
            })
        })
        .finally(() => {
            dispatch(hideSpinner())
        })
}
```

There is a lot going on in that last thunk action. Let's walk through what's
going on. At the top we have a typical JSX component. This component displays
product details. Within that component we have an Add to Cart form that is bound
to the `submitCartForm` action.

The `submitCartForm` action is where things get interesting. The action takes a
set of `formValues` that are managed by [Redux Form](https://redux-form.com).
The method extracts the `productId` and `quantity` and then starts dispatching
actions. First it shows the spinner so that the user knows that work is in
progress. Then it dispatches the `addToCart` command which is an Integration
Manager command. This command is implemented by the currently configured
connector and calls out to whatever service the connector is built for (eg.
Salesforce Commerce Cloud, Magento, etc).

The `addToCart` command returns a Promise so we can chain on the end of it. If
it completes successfully we show a modal (`dispatch(openModal...)`). In the
event of an error, the `.catch()` block will be executed and we show a
notification (`dispatch(addNotification(...))`).

We want to make sure that we don't leave the spinner showing regardless of the
result of the command so we use a `.finally()` block to hide the spinner
(`dispatch(hideSpinner())`).

## Next steps

Take a look at the commands available in the [Integration Manager API](https://docs.mobify.com/progressive-web/latest/ecommerce-integrations/api/).

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>