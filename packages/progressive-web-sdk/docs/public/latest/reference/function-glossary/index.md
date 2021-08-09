<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> We've removed this article from the site navigation because many of the source code examples in it are out of date, but we've left it here in case you still need to refer to it.
  </p>
</div>

## Introduction

Much of the code for the Mobify Platform is written in a functional programming
style. This has led us to build a variety of different types of functions. This
document aims to define these classes and discuss the usual methods of defining
them in our framework.

For many of the examples in this document, we write our functions in the
single-expression style of [ES6 arrow
functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).
In each case, if more complex logic is necessary, the single expression can be
replaced by a braced block.

Most of the functions included in our examples must be
[*pure*](https://en.wikipedia.org/wiki/Pure_function), meaning that they do not
depend on state outside of their parameters, do not have any side effects, and
do not mutate their arguments. Impure functions, particularly as
[reducers](#reducers), interfere with the correct functioning of Redux.
Exceptions to this are noted in the text.



## UI function types

### React components

- **Filenames**: `{component-name}.jsx`, `index.jsx`, `container.jsx`
- **Takes**: Props object
- **Returns**: React element

We make heavy use of React's functional components, as they are the most
lightweight way to define simple React components. The conventional way to
define a functional component in Progressive Web looks like this:

```js
const Component = ({prop1, prop2, /* etc */}) => (
    /* JSX expression using the props */
)

Component.propTypes = {
    prop1: type1,
    prop2: type2,
    /* etc */
}
```

### mapStateToProps functions

- **Filenames**: `container.jsx`, `{component-name}.jsx`
- **Takes**: Redux state
- **Returns**: Props object

The `mapStateToProps` function is one of the parameters of the `react-redux`
`connect()` higher-order component. Its purpose is to extract the relevant
information from the Redux store to determine the props of the connected React
container. It is a special case of a [selector](#selectors), but is defined in
the container file rather than with other selectors. We use the
`createPropsSelector` function from `reselect-immutable-helpers` to create
these:

```js
const mapStateToProps = createPropsSelector({
    prop1: selector1,
    prop2: selector2,
    /* etc */
})
```

(See also the [architecture guide to
selectors](../../guides/selectors/).)

**Warning**: `mapStateToProps` can take a second argument with the external
props of the connected component, but this is _strongly_ discouraged as it
prevents most of the performance optimizations that we use.

### mapDispatchToProps functions

- **Filenames**: `container.jsx`, `{component-name}.jsx`

While the `mapDispatchToProps` argument to `connect()` can be a function, we
recommend using a plain object instead. This object maps prop names to the
[action creators](#action-creators) we use in dispatching to the Redux store.
For example, we write:

```js
const mapDispatchToProps = {
    prop1: actionCreator1,
    prop2: () => actionCreator2(true),
    prop3: () => actionCreator2(false),
    /* etc */
}
```

rather than the nearly equivalent:

```js
const mapDispatchToProps = (dispatch) => {
    return {
        prop1: (arg1, arg2) => dispatch(actionCreator1(arg1, arg2)),
        prop2: () => dispatch(actionCreator2(true)),
        prop3: () => dispatch(actionCreator2(false)
    }
}
```

### Higher-order components

- **Filenames**: various
- **Takes**: A React component
- **Returns**: A different React component

A [higher-order component
(HoC)](https://facebook.github.io/react/docs/higher-order-components.html) is a
function that wraps a React component in additional functionality. Users of
other languages (e.g. Python) may be familiar with the concept of a
[_decorator_](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841#.fedb8qwzs);
higher-order components are their equivalent in React.

For most React developers, the most common example of a HoC is the `connect`
function in `react-redux`. Since `connect` has parameters, it is implemented as
a factory function returning the actual higher-order component function, which
is why the syntax for using it has two function call brackets:
`connect(mapStateToProps)(Component)`. 

One HoC that you'll see in every Mobify PWA is `template`, which takes no
parameters of its own, so it only has one level of function call:
`template(Component)`. The `template` component ensures that the state is
correctly updated and the appropriate fetch actions are dispatched before the
actual `Template` component is mounted.

For a detailed example of a higher-order component, see the source code for
`template.jsx` in your project files.

## Redux store function types

Redux is a primarily functional framework, and many of its properties come from
the conventions that the various functions that make up its moving parts follow.

### Reducers

- **Filenames**: `reducer.js`
- **Takes**: The previous Redux state, the dispatched action object
- **Returns**: The new state, including any changes required by the action

The reducer function is at the heart of Redux and is what persists data into the
Redux state to be visible to the rest of the application. The store has a single
(root) reducer that receives all actions, but it is partitioned into branches,
each with their own reducer, by the use of the `combineReducers` function.

The `combineReducers` function is called like so:

```js
const rootReducer = combineReducers({
    branch1: branch1Reducer,
    branch2: branch2Reducer,
    /* etc */
})
```

Each of the combined reducers receives all actions, but the state that is passed
to (and returned by) the reducer is only the corresponding branch, not the full
state object. Note that this makes the corresponding object in the store a plain
Javascript object rather than an Immutable.JS object.

There are many ways to write reducers; in Progressive Web we have chosen an
approach based on the `handleActions` function in the `redux-actions` library.
If the actions are created as described in [the action creator section
below](#action-creators), then we can use it in the following manner:

```js
const reducer = handleActions({
    [actionCreator1]: (state, {payload}) => (/* ... */),
    [actionCreator2]: (state, {payload}) => (/* ... */),
    /* etc */
}, initialState)
```

We use Immutable.JS to build the state object used in these reducers. In many
cases, the shape of the action payload object matches the shape of the state
object, and all we need to do is merge in the new information. A utility
function is provided in your generated project to make this common case simpler,
called `mergePayload`. It is used as follows:

```js
const reducer = handleActions({
    [actionCreator1]: mergePayload,
    [actionCreator2]: (state, {payload}) => (/* more complex handling */),
    /* etc */
}, initialState)
```

which is equivalent to:

```js
const reducer = handleActions({
    [actionCreator1]: (state, {payload}) => state.mergeDeep(payload),
    [actionCreator2]: (state, {payload}) => (/* more complex handling */),
    /* etc */
}, initialState)
```

### Selectors

- **Filenames**: `selectors.js`
- **Takes**: The Redux state
- **Returns**: Some data from the Redux state

We use selector functions to extract data from the Redux store for use in React
components. Each selector is a function of the full Redux state and returns a
particular value or branch of that state. A deeper discussion of selectors can
be found in our guide to
[selectors](../../guides/selectors/).

## Actions and action creators

We use action creator functions to create the actions that affect the Redux
store. These functions take various parameters and return action objects in a
standardized format, or, in the case of asynchronous actions, "thunk" functions
that perform operations and dispatch other actions.

### Regular action creators

- **Filenames**: `actions.js`
- **Takes**: Relevant parameters for the specific action
- **Returns**: An action object in Flux Standard Action format

We use the `redux-actions` library to create our actions to be merged into the
store. It ensures that the actions we create follow the Flux Standard Action
format, which is used by the `handleActions` function (see the
[reducer](#reducers) section) to select a function to use as a reducer for that
action. The `createAction` function from the `redux-actions` library is wrapped
by a utility function (also called `createAction`) in your project, making some
of the more complicated patterns simpler to implement.

The first parameter to `createAction` should always be a human-readable name for
the action. This is what will be shown in Redux dev tools or other debugging
systems as the type of the action.

We support two main ways to make regular action creator functions. The first way
is for actions that take a single parameter that is passed as a payload:

```js
const myAction = createAction('My Action')

// myAction('myPayload') is
// {
//     type: 'My Action',
//     payload: 'myPayload'
// }
```

This type of function is also suitable for actions that require no payload (such
as a `closeAllModals` action). In that case, the payload will be `undefined`.

The second way to make regular action creator functions is similar but specifies
a set of keys for the payload object, corresponding to the action creator's
parameters. If these keys match the target keys in the state, then the payload
can just be merged using `mergePayload`, as described [above](#reducers). For
example, we can do:

```js
const setQuantity = createAction('Set Quantity', 'quantity')
```

which will have the payload `{quantity: args[0]}` when called. This can be done
with any number of fields:

```js
const setUserData = createAction('Set User Data', 'firstName', 'lastName', 'email')

// which when we do

setUserData('Clark', 'Kent', 'ckent@dailyplanet.com')

// will give the payload

{
    firstName: 'Clark',
    lastName: 'Kent',
    email: 'ckent@dailyplanet.com'
}
```

### Thunk action creators

- **Filenames**: `actions.js`
- **Takes**: Relevant parameters for the specific action
- **Returns**: A [thunk function](#thunks)

For asynchronous or compound actions, we will use a second kind of action
creator called a thunk action creator. The thunk action creator returns a
function rather than an action object, called a thunk. We use a middleware
called `redux-thunk` that knows how to handle these thunk functions.

Thunk action creators are not created with `createAction`, they are just defined
as ordinary functions that return other functions. Examples in the next section.

### Thunks

- **Filenames**: `actions.js`
- **Takes**: The Redux `dispatch` function, and optionally a `getState` function
- **Returns**: Optionally, a Promise

A thunk function is dispatched as an action using a thunk action creator, and is
called by the `redux-thunk` middleware. The middleware provides two parameters
to the thunk, the Redux `dispatch` function for dispatching other actions, and a
`getState` function that returns a reference to the Redux state object. Thunks
are not pure functions, as they perform the side effects of dispatching actions
and/or making network requests.

We can use a thunk to simply dispatch multiple actions at once, but the most
common use case is when we need to do asynchronous actions such as network
requests. An example of an asynchronous thunk is:

```js
const getProductData = (productId) => (dispatch) => {
    return fetch(`${PRODUCT_BASE_URL}/${productId}`)
        .then((response) => response.json())
        .then((productData) => {
            dispatch(receiveProductData(productId, productData))
        })
}
```

which fetches content from the network, and then dispatches another action,
whose creator is `receiveProductData`, with the resulting new data.

The return value from a thunk is generally unused, but if it is a Promise, then
the `dispatch` call returns a Promise that resolves when the thunk Promise does.
For example, the calling code of the above thunk action could be formatted this
way:

```js
dispatch(setProductSpinner(true))
dispatch(getProductData(productId))
    .then(() => dispatch(setProductSpinner(false))
```

which can separate UI-specific concerns from data access concerns in the actions
and store.

Since thunk actions are not directly processed into the store, they do not show
up at all in the Redux dev tools. Only regular actions appear there.

### Action transforms

- **Filenames**: `actions.js`
- **Takes**: An action object (following Flux Standard Action conventions)
- **Returns**: A different action (object or thunk)

A few functions in the code are implemented as action transforms, which take one
action and process it into a different action. This can be used for parsing
input HTML, for example, where we might have a number of different parsers
acting on the same page. An example would be:

```js
const processUserPage = ({payload: {$, $response}}) => (
    receiveUserData(parseUserPage($, $response))
)
```

which reads the `$response` value out of the input action payload and passes it
through `parseUserPage` to build the actual payload that will be merged with the
state.

### Action creators with analytics

- **Filenames**: `actions.js`
- **Takes**: Relevant parameters, including the parameters for the associated
  action creator
- **Returns** An action object in Flux Standard Action format with metadata

The `redux-actions` library allows us to pass a meta creator function when we
create an action creator; the resulting actions will then have the appropriate
metadata. To create these kinds of actions, use the helper function called
`createAnalyticsMeta`. 
 
The `createAnalyticsMeta` function takes the following arguments:

* action name (string)
* action arguments (array)
* meta analytics type name (string)
* meta analytics payload creator (function)

The first 2 arguments will create the payload required for the reducer and the
last 2 arguments will create the payload required for the Analytics Manager.

Here's an example of using `createAnalyticsMeta`:

```js
import {createActionWithAnalytics} from 'progressive-web-sdk/dist/utils/action-creation'
import {
    EVENT_ACTION,
    Page,
    Transaction,
    Product,
    ShoppingList
} from 'progressive-web-sdk/dist/analytics/data-objects/'

export const onRouteChanged = createActionWithAnalytics(
    'On route changed',
    [CURRENT_URL],
    EVENT_ACTION.pageview,
    (currentURL, routeName) => (new Page({[Page.TEMPLATENAME]: routeName}))
)
```

Let's take a closer look at the last argument to `createActionWithAnalytics`,
the meta analytics payload creator.

```js
(currentURL, routeName) => (new Page({[Page.TEMPLATENAME]: routeName}))
```

This function expects 2 arguments and returns a new Page data object. The Page
data object gives us a standard set of keys for tracking page-related analytics,
such as the page's template name.

For more information about data objects, please read about our [Analytics
Schema](../../analytics/analytics-schema/).

## Miscellaneous functions

### HTML parsers

- **Filenames**: `parsers.js`, `parsers/<name>.js`
- **Takes**: the jQuery `$` object, and a jQuery object containing the HTML to
  be parsed
- **Returns**: An object with the parsed data

For builds that are backed by desktop HTML, we use parser functions to extract
the necessary data from those pages. These use jQuery on the input document for
ease of extraction.

As there may be multiple jQuery versions on the page due to the requirements of
third-party scripts, the jQuery object itself is passed to the parser to ensure
that it is the version used by the Progressive Web build. Generally, this will
be passed by the `jqueryResponse` utility function in the SDK, which processes
an HTML response into a jQuery object.

We can have a variety of parsers that may all process the same page. For
example, there may be one parser that reads the navigation menu information, one
parser that reads footer information, and one parser that reads the data for the
main part of the page. In that case, we can do something that looks like this:

```js
// this is a thunk action creator, see above
const fetchPage = (url) => (dispatch) => {
    return fetch(url)
        .then(jqueryResponse)
        .then(([$, $response]) => {
            dispatch(receiveNavigation(navParser($, $response)))
            dispatch(receiveFooter(footerParser($, $response)))
            dispatch(receiveBody(bodyParser($, $response)))
        })
}
```

A more realistic example of using parsers can be found in
`app/containers/app/actions.js`, the global actions source file. In this case,
we use [action transforms](#action-transforms) to wrap the parsers, reducing the
logic necessary in the global fetch page action.

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>