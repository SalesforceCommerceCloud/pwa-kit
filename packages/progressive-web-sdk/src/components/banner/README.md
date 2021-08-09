```js static
// JS import
import Banner from 'progressive-web-sdk/dist/components/banner'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/banner/base';
```


## Example Usage

```jsx
<Banner icon="info" title="info">
    Save 20% on your order with the code SAVEBIG
</Banner>
```

## Example of `isAlert` Banner

```jsx
<Banner isAlert href="http://www.mobify.com" icon="info" title="info">
    You are currently offline.
</Banner>
```

## Example of Banner with custom icon

```jsx
<Banner icon="help" title="help">
    Did you know you can save 20% on your order with the code SAVEBIG?
</Banner>
```
