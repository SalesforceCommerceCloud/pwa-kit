```js static
// JS import
import Image from 'progressive-web-sdk/dist/components/image'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/image/base';
```


## Example Usage

```jsx
<Image src="http://bit.ly/2FnkL26" width="300px" height="93px" alt="Mobify Logo" />
```


## Example With `srcSet`

```jsx

    const cat1 = 'https://s-media-cache-ak0.pinimg.com/564x/72/4b/6d/724b6d' +
        'bf91c378a53d6890bb525c1aa9.jpg';
    const cat2 = 'https://s-media-cache-ak0.pinimg.com/564x/af/f7/43/aff743' +
        '479fc29789d2231329453b1abc.jpg';

    <Image
    srcSet={[
        `${cat2} 2100w`,
        `${cat1} 700w`]}
    src={cat1}
    alt="Cats!"
    />
```

## Example With `useLoaderDuringTransitions`

```jsx
initialState = {
    src: "https://unsplash.it/400/300",
    useLoaderDuringTransitions: true
};

const transitionImage = function() {
    if (/300/.test(state.src)) {
        setState({src: "https://unsplash.it/400/200"})
    } else {
        setState({src: "https://unsplash.it/400/300"})
    }
};

const changeUseLoaderDuringTransitions = function() {
    setState({useLoaderDuringTransitions: !state.useLoaderDuringTransitions})
};

<span>
    <Image src={state.src} useLoaderDuringTransitions={state.useLoaderDuringTransitions} artificialLoadingDelay={1000} loadingIndicator={<img src="http://bit.ly/1UYhBmo"/>} />
    <button onClick={changeUseLoaderDuringTransitions}> {"useLoaderDuringTransitions=" + state.useLoaderDuringTransitions}</button>
    <button onClick={transitionImage}>Change image src (simulates image load delay of 1000ms)</button>
</span>
```

## Example With Inline Styles
Please note that the `width` property is overridden by the `imageStyle.width`.
```jsx
const wrapperStyle = {
    position: 'relative',
    left: '160px'
};
const imageStyle = {
    borderRadius: '10px',
    height: '80px',
    width: '80px',
};
const cat = 'https://s-media-cache-ak0.pinimg.com/564x/72/4b/6d/724b6d' +
        'bf91c378a53d6890bb525c1aa9.jpg';
<Image src={cat} wrapperStyle={wrapperStyle} imageStyle={imageStyle} width="400px" />

```

