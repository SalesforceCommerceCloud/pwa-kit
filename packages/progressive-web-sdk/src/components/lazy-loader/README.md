```js static
// JS import
import LazyLoader from 'progressive-web-sdk/dist/components/lazy-loader'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/lazy-loader/base';
```


## Example Usage

The simplest usage of the LazyLoader can be seen as the following:

```jsx
// First thing we do is track in the state what has
// loaded so far. The loaded count will start at 0,
// growing to 1 only after the content is loaded
initialState = {
    totalLoaded: 0,
    content: 'Lazily waiting around...'
};

// Second thing, we define a callback function that
// updates the state with the newly "fetched" content
const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                totalLoaded: 1,
                content: 'Content has lazily loaded!'
            }, resolve)
        }, 2000)
    });
};

// Lastly, we render the LazyLoader component and its
// current state. Only after the user scrolls the
// component into view will it trigger the
// `fetchLazyContent` callback.
<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.totalLoaded}
>
    {state.content}
</LazyLoader>
```

You might notice that the above example will always attempt to load something everytime you scroll. That is because we have provided the component with a way of knowing when it has finished lazy loading "all" its content. For example, if you are gradually loading small chunks from a list of hundreds of items, you want to stop lazy loading once hit the total item count.

Providing the `LazyLoad` component with the information it needs to stop can be done like the following (continue from the example above)

```jsx
initialState = {
    totalLoaded: 0,
    content: 'Lazily waiting around...'
};

const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                totalLoaded: 1,
                content: 'Content has lazily loaded!'
            }, resolve)
        }, 2000)
    });
};

// Everything so far is the same. The only thing we
// are changing is adding the `itemTotal` prop below,
// which tells the component to stop trying to lazy
// load once the `currentItemCount` hits that number.
<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.totalLoaded}
    itemTotal={1}
>
    {state.content}
</LazyLoader>
```


## Example of Lazy Fetching E-Commerce Content

A common e-commerce example would be to lazy load product items. We do not have all of the items on first render, so we must request for more as we scroll through the page.

Notice how the `LazyLoader`'s "loading" state won't trigger until the very **end** of the component has scrolled into view.

```jsx
// We start off with having only a few items already
// in the state.
initialState = {
    items: [{
        name: 'Tegano Dress Engineered Tee',
        price: '$245'
    }, {
        name: 'Adraya Dress in Barnet Check',
        price: '$295'
    }]
};

// We define a function that will fetch content
// from "the server" and update the state.
const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate fetching new items from the server
        const newItems = [
            ...state.items,
            {
                name: 'Split Neck Silk Tunic',
                price: '$89'
            }, {
                name: 'Petite Signature Slim Pants',
                price: '$89'
            }
        ]

        // Simulate a little latency
        setTimeout(() => {
            setState({
                items: newItems
            }, resolve)
        }, 2000)
    });
};

<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.items.length}
    itemTotal={4}
>
    {state.items.map(({name, price}) =>
        <div key={name} className="u-flexbox u-margin-bottom">
            <Image
                src="http://www.url.com/does-not-exist.jpg"
                width="50px"
                height="50px"
                alt={name}
            />

            <div className="u-flex u-padding-start">
                <div>{price}</div>
                <div>{name}</div>
            </div>
        </div>
    )}
</LazyLoader>
```


## Example Of E-Commerce Lazy Rendering (No Fetch!)

In this example, we already have all the items we need, but we want to delay rendering some items until the user scrolls down far enough. This might happen if the contents of those items have, for example, performance costly images.

```jsx
// First we setup our complete list of items. We
// will not be fetching for any more in this example
const items = [{
    name: 'Tegano Dress Engineered Tee',
    price: '$245'
}, {
    name: 'Adraya Dress in Barnet Check',
    price: '$295'
}, {
    name: 'Davah Dress in Light Poplin',
    price: '$295'
}, {
    name: 'Stenna Dress in Seasons',
    price: '$395'
}, {
    name: 'Petite Signature Velvet Slim Pants',
    price: '$89'
}, {
    name: 'Cascade Ruffle Front Top',
    price: '$59'
}];

// In our state we track how many items we want
// to show at a time. This number will grow to show
// more as the LazyLoader is scrolled through.
initialState = {
    itemsToDisplay: 2
};

// Since are not "fetching" anything, instead of
// simulating a network call, we'll just update the
// state to gradually increase the value of
// `itemsToDisplay`
const loadMore = ({lastPosition}) => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                itemsToDisplay: lastPosition
            }, resolve)
        }, 2000)
    });
};

// Here we pick out only the items from the `items`
// array that we want to show based on the value of
// `itemsToDisplay`
const itemsToRender = items.length >= state.itemsToDisplay
    ? items.slice(0, state.itemsToDisplay)
    : items;

// Notice that we have added the `itemsPerPage` prop.
// This is necessary make sure that the `loadMore`
// function above receives the correct value for its
// `lastPosition` argument
<LazyLoader
    fetchItems={loadMore}
    currentItemCount={itemsToRender.length}
    itemTotal={items.length}
    itemsPerPage={2}
>
    {itemsToRender.map(({name, price}) =>
        <div key={name} className="u-flexbox u-margin-bottom">
            <Image
                src="http://www.url.com/does-not-exist.jpg"
                width="50px"
                height="50px"
                alt={name}
            />

            <div className="u-flex u-padding-start">
                <div>{price}</div>
                <div>{name}</div>
            </div>
        </div>
    )}
</LazyLoader>
```


## Example With A Load More Button

Instead of waiting for the user to scroll to the `LazyLoader` component, the user can decide for themselves to load more by clicking on a "Load More" button. Providing such a button is as simple as setting `useLoadMoreButton` to `true`. See below:

```jsx
initialState = {
    totalLoaded: 0,
    content: 'Lazily waiting around...'
};

const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                totalLoaded: 1,
                content: 'Content has lazily loaded!'
            }, resolve)
        }, 2000)
    });
};

// We set `useLoadMoreButton` to true to show the
// button.
<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.totalLoaded}
    useLoadMoreButton={true}
>
    {state.content}
</LazyLoader>
```

The Load More button can of course be customized using the `loadMoreButtonClassName` and `loadMoreItemsMessage` props.

```jsx
initialState = {
    totalLoaded: 0,
    content: 'Lazily waiting around...'
};

const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                totalLoaded: 1,
                content: 'Content has lazily loaded!'
            }, resolve)
        }, 2000)
    });
};

// Here we customize the load more button by giving
// it a modifier class, and also altering its
// message
<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.totalLoaded}
    useLoadMoreButton={true}
    loadMoreButtonClassName={'pw--secondary u-width-full'}
    loadMoreItemsMessage={'Load more items while you can!'}
>
    {state.content}
</LazyLoader>
```

The last thing to know about the load more button is that you can customize its text for when all items have loaded. In order for this to work, not only do you need to provide the message to the `allItemsLoadedMessage` prop, but you also **must** provide a `itemTotal` count, otherwise the LazyLoader will not know when to change the message it displays in the load more button.

```jsx
initialState = {
    totalLoaded: 0,
    content: 'Lazily waiting around...'
};

const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                totalLoaded: 1,
                content: 'Content has lazily loaded!'
            }, resolve)
        }, 2000)
    });
};

// Here we provide a custom message that only displays
// once `currentItemCount` and `itemTotal` meet!
allItemsLoadedMessage = "Sorry, no more items left!";

// Notice below that we also add `itemTotal` so the
// component has something to compare its
// `currentItemCount` to know when it's reached
// the end
<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.totalLoaded}
    useLoadMoreButton={true}
    loadMoreButtonClassName={'pw--tertiary u-width-full'}
    loadMoreItemsMessage={'Load more items while you can!'}
    itemTotal={1}
    allItemsLoadedMessage={allItemsLoadedMessage}
>
    {state.content}
</LazyLoader>
```


## Example With `loadingIndicator` Prop

```jsx
initialState = {
    totalLoaded: 0,
    content: 'Lazily waiting around...'
};

const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                totalLoaded: 1,
                content: 'Content has lazily loaded!'
            }, resolve)
        }, 2000)
    });
};

// Create a custom React node to pass to the
// `LazyLoader`'s `loadingIndicator` prop
const loadingIcon = (
    <div>
        <Icon name="caution" />
        <span>Caution! Loading something!</span>
    </div>
);

<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.totalLoaded}
    loadingIndicator={loadingIcon}
>
    {state.content}
</LazyLoader>
```


## Accessible Screen Reader Support

For users that require screen reader support, we have included a prop to allow developers to customize what message those users will receive when the LazyLoader finishes updating: the `notificationAddedMessage` prop.

In the example below, I update the `notificationAddedMessage` prop to a new value, but you won't be able to hear it unless you are using a screen reader.

Note that whether you set a notification message or not, the user will be notified either way. There is of course a default message, and the `notificationAddedMessage` overrides that default message.

```jsx
initialState = {
    totalLoaded: 0,
    content: 'Screen reader waiting to hear update...'
};

const fetchLazyContent = () => {
    return new Promise((resolve) => {
        // Simulate a little latency
        setTimeout(() => {
            setState({
                totalLoaded: 1,
                content: 'Screen reader users notified!'
            }, resolve)
        }, 2000)
    });
};

// Here we create a new message to provide screen
// reader users!
const screenReaderMessage = "We have downloaded and updated your content.";

<LazyLoader
    fetchItems={fetchLazyContent}
    currentItemCount={state.totalLoaded}
    notificationAddedMessage={screenReaderMessage}
>
    {state.content}
</LazyLoader>
```
