```js static
// JS import
import Card from '../components/card'
```

## Basic Usage

```jsx
    <Card
        header={
            <h1>Header</h1>
        }
        children={
            <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit</div>
        }
        footer={
            <div>Footer</div>
        }
    />
```

## Example with borders and shadow
```jsx
    <Card
        header={
            <h1>Header</h1>
        }
        children={
            <div>Children content with shadow and borders</div>
        }
        footer={
            <div>Footer</div>
        }
        hasShadow
        hasBorder
    />
```
