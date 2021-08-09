```js static
// JS import
import ScrollTrigger from 'progressive-web-sdk/dist/components/scroll-trigger'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/scroll-trigger/base';
```

## Best Practices
When using this component, we recommend that you group several elements into a single `ScrollTrigger` when possible. This helps limit the number of event listeners added to the page, and the number of event handlers that need to run. For example, if you want to do something when products on a product list are scrolled into view, consider grouping several products together in a single `ScrollTrigger`. See `Example Usage - Grouped Items` for an example of this.

We also recommend that your `onEnter` and `onLeave` functions are able to execute quickly. In order to maintain 60fps during scrolling, each frame only has about [10ms](https://developers.google.com/web/fundamentals/performance/rendering/#60fps_and_device_refresh_rates) to complete all its work. `onEnter` and `onLeave` functions that exceed that frame budget can cause jank when scrolling. If necessary, consider breaking up your work across multiple frames using `requestAnimationFrame` to say within this budget.


## Example Usage

```jsx
initialState = { inView: false };

<div>
    <div style={{height: '200px'}}>
        {state.inView ? 'The cat is visible!' : 'The cat is not visible.'}
    </div>
    <ScrollTrigger
        onEnter={() => setState({inView: true})}
        onLeave={() => setState({inView: false})}
    >
        <Image src="http://media2.popsugar-assets.com/files/thumbor/DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-:strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemade-Salmon-Popsicle-Cat-Treat.jpg" alt="Cat" />
    </ScrollTrigger>
</div>
```

## Example Usage - Offset
A negative offsetTop can be used to do something before the content has been scrolled into view.

```jsx
initialState = { inView: false };

<div>
    <div style={{height: '200px'}}>
        {state.inView ? 'The cat is visible!' : 'The cat is not visible.'}
    </div>
    <ScrollTrigger
        onEnter={() => setState({inView: true})}
        onLeave={() => setState({inView: false})}
        offsetTop={-100}
    >
        <Image src="https://s-media-cache-ak0.pinimg.com/564x/72/4b/6d/724b6dbf91c378a53d6890bb525c1aa9.jpg" alt="Cat" />
    </ScrollTrigger>
</div>
```

## Example Usage - Grouped Items

```jsx
initialState = { firstRowInView: false, secondRowInView: false };
gridProps = {
    mobile: {span: 2},
    tablet: {span: 4},
    desktop: {span: 6}
};

<div>
    <div style={{height: '200px'}}>
        <p>{state.firstRowInView ? 'The first row is visible!' : 'The first row is not visible.'}</p>
        <p>{state.secondRowInView ? 'The second row is visible!' : 'The second row is not visible.'}</p>
    </div>
    <ScrollTrigger
        onEnter={() => setState({firstRowInView: true})}
        onLeave={() => setState({firstRowInView: false})}
    >
        <Grid>
            <GridSpan {...gridProps}>
                <Image src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/e/y/eye-of-newt-1.jpg" alt="Eye of Newt" />

                <div>Eye of Newt</div>
                <div>$12.00</div>
            </GridSpan>
            <GridSpan {...gridProps}>
                <Image src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/u/n/unicorn-blood-1.jpg" alt="Unicorn Blood" />

                <div>Unicorn Blood</div>
                <div>$12.00</div>
            </GridSpan>
        </Grid>
    </ScrollTrigger>
    <ScrollTrigger
        onEnter={() => setState({secondRowInView: true})}
        onLeave={() => setState({secondRowInView: false})}
    >
        <Grid>
            <GridSpan {...gridProps}>
                <Image src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/a/g/aging-potion-1.jpg" alt="Aging Potion" />

                <div>Aging Potion</div>
                <div>$25.00</div>
            </GridSpan>
            <GridSpan {...gridProps}>
                <Image src="https://www.merlinspotions.com/media/catalog/product/cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/d/r/dragon-tonic-1.jpg" alt="Dragon Tonic" />

                <div>Dragon Tonic</div>
                <div>$60.00</div>
            </GridSpan>
        </Grid>
    </ScrollTrigger>
</div>
```
