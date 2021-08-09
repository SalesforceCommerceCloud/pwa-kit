```js static
// JS import
import Search from 'progressive-web-sdk/dist/components/search'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/search/base';
```


## Example usage

```jsx
<Search />
```


## Example with custom button

Props given to `submitButtonProps` are passed to the internal `Button` component

```jsx
<Search submitButtonProps={{
    className: 'pw--secondary',
    text: 'submit'
}} />
```


## Example with suggestions

Start typing something into the below example to view the example suggestions.

```jsx
const addSuggestions = () => setState({
    termSuggestions: [
        {href: '#', children: 'test'},
        {children: 'search'}
    ],
    productSuggestions: [
        {
            isSimple: true,
            imageProps: {
                src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
                width: "88px",
                height: "88px",
                alt: "cat"
            },
            title: "Product Title",
            price: "$2000",
            onClick: () => {console.log('clicked')}
        },
        {
            isSimple: true,
            imageProps: {
                src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
                width: "88px",
                height: "88px",
                alt: "cat"
            },
            href: '#',
            price: "$2000",
            title: "Product Title2"
        },
    ]
});

const clearSuggestions = () => setState({
    termSuggestions: null,
    productSuggestions: null
});

<Search
    termSuggestions={state.termSuggestions}
    productSuggestions={state.productSuggestions}
    onChange={addSuggestions}
    onClose={clearSuggestions}
    onClear={clearSuggestions}
    onClickSuggestion={clearSuggestions}
/>
```


## Example with the clear button hidden

When typing in the `Search` component, a "Clear" button will appear (test this using any other example on this page). But if you want to keep it hidden, you can do so by setting `includeClearButton={false}`.

```jsx
<Search includeClearButton={false} />
```


## Example with simultaneous page interactions allowed

The mask that overlays the page while focused on the `Search` component can be disabled by using the `allowPageInteractions` prop. Notice in the example below that focusing on the search input, no full page overlay mask is rendered, which allows you to interact with the rest of the page.

```jsx
<Search allowPageInteractions />
```


## Example with `isOverlay`

"isOverlay" changes the `Search` component to not render on the page by default. In this mode, it will only render when

```jsx
initialState = {isOpen: false};
const openSearch = () => setState({isOpen: true});
const openClose = () => setState({isOpen: false});

<div>
    <Search
        isOverlay
        isOpen={state.isOpen}
        onClose={openClose}
    />
    <button onClick={openSearch}>
    	Open search overlay
    </button>
</div>
```


## Example with `isOverlay` and alternate input bar layout

The `isOverlay` version of the `Search` component can be customized by setting with `replaceSearchWithClose`, which (as the prop name implies) replaces the search button with a close button. The close button can then be further customized using `closeButtonProps`.

```jsx
initialState = {isOpen: false};
const openSearch = () => setState({isOpen: true});
const openClose = () => setState({isOpen: false});

<div>
    <Search
        isOverlay
        isOpen={state.isOpen}
        onClose={openClose}
        replaceSearchWithClose
        closeButtonProps={{
            text: 'close'
        }}
    />
    <button onClick={openSearch}>
    	Open search overlay
    </button>
</div>
```
