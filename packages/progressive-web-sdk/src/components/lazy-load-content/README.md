```js static
// JS import
import LazyLoadContent from 'progressive-web-sdk/dist/components/lazy-load-content'
```

## Example Usage

```jsx
<LazyLoadContent placeholder={<SkeletonBlock height="250px" width="250px" />}>
    <Image
        src="https://i.pinimg.com/564x/af/f7/43/aff743479fc29789d2231329453b1abc.jpg"
        alt="Alt text"
        height="250px"
        width="250px"
    />
</LazyLoadContent>
```

## Threshold usage: # of pixel out of viewport before loading images with `scrollCheckInterval` to delay invoking the function

```jsx
<div>
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <LazyLoadContent
        placeholder={<SkeletonBlock height="250px" width="250px" />}
        threshold={200}
        scrollCheckInterval={400}
    >
        <Image
            src="https://i.pinimg.com/564x/af/f7/43/aff743479fc29789d2231329453b1abc.jpg"
            alt="Alt text"
            height="250px"
            width="250px"
        />
    </LazyLoadContent>
</div>
```
