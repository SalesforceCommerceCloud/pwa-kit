```js static
// JS import
import CardVerification from 'progressive-web-sdk/dist/components/card-verification'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/card-verification/base';
```


## Example Usage Visa

```jsx
initialState = {cvv: ""};

<CardVerification
    cardNumber="4111111111111111"
    value={state.cvv}
    onChange={(value)=>{
        setState({cvv: value})
    }}
    onBlur={()=> {}}
/>
```

## Example Usage Amex

```jsx
initialState = {cvv: ""};

<CardVerification
    cardNumber="3456333222111222"
    value={state.cvv}
    onChange={(value)=>{
        setState({cvv: value})
    }}
    onBlur={()=> {}}
/>
```
