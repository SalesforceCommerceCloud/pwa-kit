```js static
// JS import
import Scroller from 'progressive-web-sdk/dist/components/scroller'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/scroller/base';
```


## Example Usage

```jsx
<Scroller>
    <div className="u-color-brand"> This is the first item of scroller</div>
    <div> This is the second item of scroller</div>
    <div className="u-color-brand"> This is the third item of scroller</div>
</Scroller>
```

## Example With Image

```jsx
const cat1 = 'http://media2.popsugar-assets.com/files/thumbor/' +
    'DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-' +
    ':strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16' +
    '594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemad' +
    'e-Salmon-Popsicle-Cat-Treat.jpg';
const cat2 = 'https://s-media-cache-ak0.pinimg.com/564x/72/4b/6d/724b6d' +
    'bf91c378a53d6890bb525c1aa9.jpg';
    
<Scroller>
    <Image src={cat1} />
    <Image src={cat2} />
</Scroller>
```
