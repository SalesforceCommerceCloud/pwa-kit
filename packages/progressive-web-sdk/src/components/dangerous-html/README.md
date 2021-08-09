```js static
// JS import
import DangerousHTML from 'progressive-web-sdk/dist/components/dangerous-html'
```


## Example Usage

```jsx
<DangerousHTML html="<strong>A string of<br />HTML</strong>">
    {(htmlObj) => <div dangerouslySetInnerHTML={htmlObj} />}
</DangerousHTML>
```
