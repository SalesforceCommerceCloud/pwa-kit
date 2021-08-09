```js static
// JS import
import ExpiryDate from 'progressive-web-sdk/dist/components/expiry-date'
```


## Example Usage

```jsx
initialState = {expiry: "2119"};

<ExpiryDate
    value={state.expiry}
    placeholder="MM/YY"
    onChange={(value)=>{
        setState({expiry: value})
    }}
    onBlur={()=> {}}
/>
```
