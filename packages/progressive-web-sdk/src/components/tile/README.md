```js static
// JS import
import Tile from 'progressive-web-sdk/dist/components/tile'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/tile/base';
```


## Example Usage

```jsx
<Tile
    href= "#"
    imageProps={{
        src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
        width: "88px",
        height: "88px",
        alt: "cat"
    }}
    options={
        [
            {
                label: "Color: ",
                value: "Maroon"
            },
            {
                label: "Size: ",
                value: "XL"
            }
        ]
    }
    title="Product Title"
    quantityLabel="Quantity: "
    quantity={1}
    price="$2000"
/>
```


## Example With `isSimple`

```jsx
<Tile
    isSimple
    imageProps={{
        src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
        width: "75px",
        height: "75px",
        alt: "cat"
    }}

    title="Product Title"
    price="$2000"
/>
```


## Example With `isFull`

```jsx
<Tile
    isFull
    imageProps={{
        src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
        width: "142px",
        height: "142px",
        alt: "cat"
    }}

    ratingProps={{
        className: "pw--solid",
        count: 3,
        total: 5
    }}

    title="Product Title"
    price="$2000"
/>
```


## Example With `isColumn`

```jsx
<Tile
    isColumn
    imageProps={{
        src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
        width: "142px",
        height: "142px",
        alt: "cat"
    }}

    ratingProps={{
        className: 'pw--solid',
        count: 3,
        total: 5
    }}

    title="Product Title"
    color="Maroon"
    size="XL"
    quantity="1"
    price="$2000"
/>
```


## Example With `isColumn` and `isFull`

```jsx
<Tile
    isColumn
    isFull
    imageProps={{
        src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
        width: "296px",
        height: "296px",
        alt: "cat"
    }}

    ratingProps={{
        className: 'pw--solid',
        count: 3,
        total: 5
    }}

    title="Product Title"
    color="Maroon"
    size="XL"
    quantity="1"
    price="$2000"
/>
```
