```js static
// JS import
import Feedback from 'progressive-web-sdk/dist/components/feedback'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/feedback/base';
```


## Example Usage

```jsx
<Feedback text="Hear me roar!" />
```

## Example of Error Feedback

```jsx
<Feedback isError icon="caution" title="caution" text="This is an inline error message." />
```

## Example of Success Feedback

```jsx
<Feedback isSuccess icon="check" title="check" text="This is an inline success message." />
```

## Example of Error Block Feedback

```jsx
<Feedback isError isBlock icon="caution" text="This is a block message." />
```

## Example of Success Block Feedback

```jsx
<Feedback isSuccess isBlock icon="check" text="This is a block message." />
```
