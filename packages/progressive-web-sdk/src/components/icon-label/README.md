```js static
// JS import
import IconLabel from 'progressive-web-sdk/dist/components/icon-label'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/icon-label/base';
```

## Basic Example Usage

```jsx
<IconLabel label="Close" iconName="close" />
```

## IconLabel with render `button` element

```jsx
const clickFunction = () => {
    alert('Clicked')
};

<IconLabel label="Add To Cart" iconName="cart" button={{analyticsName: 'analytics-name', onClick: clickFunction, buttonInnerClassName: 'inner-class-name', buttonProps: {openInNewTab: true, href: '#'} }} />
```
