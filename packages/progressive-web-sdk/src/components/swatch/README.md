```js static
// JS import
import {Swatch, SwatchItem} from 'progressive-web-sdk/dist/components/swatch'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/swatch/base';
```


## Example Usage

```jsx
initialState = {
    value: 's'
};

<Swatch label="Size" value={state.value} onChange={(value) => setState({value})}>
    <SwatchItem value="xs">
        XS
    </SwatchItem>
    <SwatchItem value="s">
        S
    </SwatchItem>
    <SwatchItem value="m">
        M
    </SwatchItem>
    <SwatchItem value="l">
        L
    </SwatchItem>
</Swatch>
```


## Example With Disabled

```jsx
initialState = {
    value: '100'
};

<Swatch label="Size" value={state.value} onChange={(value) => setState({value})}>
    <SwatchItem value="100">
        $100
    </SwatchItem>
    <SwatchItem value="150-200" disabled>
        $150 - $200
    </SwatchItem>
</Swatch>
```


## Example of Color Swatches

```jsx
initialState = {
    value: 'green'
};

<Swatch label="Color" value={state.value} onChange={(value) => setState({value})}>
    <SwatchItem label="Green" value="green" color="#E1EAD0" />
    <SwatchItem label="Yellow" value="yellow" color="#FFF9AD" />
    <SwatchItem label="Pinky Peach" value="peach" color="#FDD7C9" disabled />
    <SwatchItem label="Purple" value="purple" color="#D6CDE6" />
</Swatch>
```


## Example of Image Swatches

```jsx
initialState = {
    value: 'mittens'
};

<Swatch label="Cool Cat" value={state.value} onChange={(value) => setState({value})}>
    <SwatchItem label="Rex" value="rex">
        <Image
            width="50px"
            src="http://media2.popsugar-assets.com/files/thumbor/\
DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-:\
strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_\
16594958_1436816964_11378154_1591447017795211_1999564903_n/i/\
Homemade-Salmon-Popsicle-Cat-Treat.jpg"
            alt="Rex"
        />
    </SwatchItem>
    <SwatchItem label="Mittens" value="mittens">
        <Image
            width="50px"
            src="https://s-media-cache-ak0.pinimg.com/564x/72/4b/6d/724b6dbf91c378a53d6890bb525c1aa9.jpg"
            alt="Mittens"
        />
    </SwatchItem>
    <SwatchItem label="Shadow" value="shadow" disabled>
        <Image
            width="50px"
            src="https://librestock.com/media/thumbs/cat-984367_640.jpg"
            alt="Shadow"
        />
    </SwatchItem>
</Swatch>
```
