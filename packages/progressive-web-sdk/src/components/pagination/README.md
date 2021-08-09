```js static
// JS import
import Pagination from 'progressive-web-sdk/dist/components/pagination'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/pagination/base';
```


## Example Usage

```jsx
initialState = { currentPage: 1 };
<Pagination
    onChange={(newPage) => { setState({ currentPage: newPage }) }}
    currentPage={state.currentPage}
    pageCount={5}
    showCurrentPageMessage={false}
/>
```

The Pagination component's parent is responsible for managing the currentPage prop. This allows pagination to work well with Redux.

## Example With No Page Buttons

```jsx
initialState = { currentPage: 1 };
<Pagination
    onChange={(newPage) => { setState({ currentPage: newPage }) }}
    currentPage={state.currentPage}
    pageCount={8}
    showPageButtons={false}
/>
```

## Example With First and Last Buttons

First and Last buttons can also be added to the pagination. The `firstButton` and `lastButton` props accept an object which describes this button. The contents of the `text` attribute will be shown inside the button. Anything in the `props` attribute will be passed down to the button itself. `nextButton` and `prevButton` can also be customized in this way.

When any of the buttons are clicked, the function passed via the `onChange` prop will be called. It will be passed the selected page number.

```jsx
initialState = { currentPage: 1 };
<Pagination
    onChange={(newPage) => { setState({ currentPage: newPage }) }}
    currentPage={state.currentPage}
    pageCount={5}
    showCurrentPageMessage={false}
    prevButton={{props: { icon: 'chevron-left', title: 'Previous', className: "pw--tertiary"}}}
    nextButton={{props: { icon: 'chevron-right', title: 'Next', className: "pw--tertiary"}}}
    firstButton={{
        text: 'First'
    }}
    lastButton={{
        text: 'Last'
    }}
/>
```

## Example With No Next/Previous Buttons

Next and Previous buttons are shown by default. In order to hide these buttons, you can pass `null` for the `nextButton` and `prevButton` props.

```jsx
initialState = { currentPage: 1 };
<Pagination
    onChange={(newPage) => { setState({ currentPage: newPage }) }}
    currentPage={state.currentPage}
    pageCount={5}
    nextButton={null}
    prevButton={null}
/>
```


## Example With Custom Current Page Message

```jsx
initialState = { currentPage: 1 };
<Pagination
    onChange={(newPage) => { setState({ currentPage: newPage }) }}
    currentPage={state.currentPage}
    pageCount={8}
    showPageButtons={false}
    getCurrentPageMessage={(current, total) => `You are on page ${current} of ${total}`}
/>
```


## Example of Showing Subset of Pages

If you have a lot of pages, you can show a subset of those pages with the `pagesToShow` prop.

```jsx
initialState = { currentPage: 1 };
<Pagination
    onChange={(newPage) => { setState({ currentPage: newPage }) }}
    currentPage={state.currentPage}
    pageCount={20}
    pagesToShow={5}
    showCurrentPageMessage={false}
    firstButton={{
        text: 'First'
    }}
    lastButton={{
        text: 'Last'
    }}
/>
```


## Example of Showing Subset of Pages With Start and End

If you always want a certain number of pages to be visible at the start and end of the pagination, you can use the `pagesToShowAtStart` and `pagesToShowAtEnd` props. `pagesToShow` must be greater than `pagesToShowAtEnd` and `pagesToShowAtStart` combined.

```jsx
initialState = { currentPage: 1 };
<Pagination
    onChange={(newPage) => { setState({ currentPage: newPage }) }}
    currentPage={state.currentPage}
    pageCount={10}
    pagesToShow={5}
    pagesToShowAtStart={2}
    pagesToShowAtEnd={2}
    showCurrentPageMessage={false}
    firstButton={{
        text: 'First'
    }}
    lastButton={{
        text: 'Last'
    }}
/>
```


## Example With Select Pagination

```jsx
initialState = { currentPage: 2 };
<Pagination
    isSelect
    onChange={(newPage) => {
        setState({ currentPage: newPage })
    }}
    currentPage={state.currentPage}
    pageCount={4}
    showPageButtons={false}
    showCurrentPageMessage={false}
/>
```


## Example Custom Select Option Text

```jsx
initialState = { currentPage: 1 };
<Pagination
    isSelect
    onChange={(newPage) => {
        setState({ currentPage: newPage })
    }}
    currentPage={state.currentPage}
    pageCount={4}
    showPageButtons={false}
    showCurrentPageMessage={false}
    getSelectOptionMessage={(current, total) => `Go to page ${current} of ${total}`}
    getCurrentPageMessage={(current, total) => `You are on page ${current} of ${total}`}
/>
```
