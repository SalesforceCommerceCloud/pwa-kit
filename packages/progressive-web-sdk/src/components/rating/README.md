```js static
// JS import
import Rating from 'progressive-web-sdk/dist/components/rating'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/rating/base';
```


## Example Usage

```jsx
<div>
    <div className="u-margin-bottom">
        <Rating name="star" count={2.5} total={5}/>
    </div>

    <div className="u-margin-bottom">
        <Rating className="pw--solid" name="star" count={2.5} total={5}/>
    </div>
</div>
```

## Example With src

```jsx
<div>
    <Rating
        count={2}
        total={7}
        className="pw--opaque"
        src="http://www.mariowiki.com/images/a/a1/Q_Block.png"
    />
</div>
```
