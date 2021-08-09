```js static
// JS import
import Carousel from 'progressive-web-sdk/dist/components/carousel'
import CarouselItem from 'progressive-web-sdk/dist/components/carousel/carousel-item'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/carousel/base';
```


## Example Usage

```jsx
const cat1 = 'http://media2.popsugar-assets.com/files/thumbor/' +
    'DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-' +
    ':strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16' +
    '594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemad' +
    'e-Salmon-Popsicle-Cat-Treat.jpg';
const cat2 = 'https://s-media-cache-ak0.pinimg.com/564x/72/4b/6d/724b6d' +
    'bf91c378a53d6890bb525c1aa9.jpg';
const cat3 = 'https://s-media-cache-ak0.pinimg.com/564x/af/f7/43/aff743' +
    '479fc29789d2231329453b1abc.jpg';
const cat4 = 'http://res.cloudinary.com/monsterpetsupplies/image/upload/' +
    'c_pad,w_500,h_500/v1456507382/Product/Boris_Side_On_Eating_Sealed_' +
    'Pet_Bowl_2.jpg';

<Carousel
    previousIcon="chevron-left"
    nextIcon="chevron-right"
    iconSize="medium"
    buttonClass="pw--secondary"
>
    <CarouselItem>
        <Image src={cat1} alt="Cat eating a treat" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat2} alt="Cat looking at the camera" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat3} alt="Two cats cuddling" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat4} alt="Cat eating food" draggable="false"/>
    </CarouselItem>
</Carousel>
```

## Example of Two Slides

```jsx
const cat1 = 'http://media2.popsugar-assets.com/files/thumbor/' +
    'DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-' +
    ':strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16' +
    '594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemad' +
    'e-Salmon-Popsicle-Cat-Treat.jpg';
const cat4 = 'http://res.cloudinary.com/monsterpetsupplies/image/upload/' +
    'c_pad,w_500,h_500/v1456507382/Product/Boris_Side_On_Eating_Sealed_' +
    'Pet_Bowl_2.jpg';

<Carousel
    previousIcon="chevron-left"
    nextIcon="chevron-right"
    iconSize="medium"
    buttonClass="pw--secondary"
>
    <CarouselItem>
        <Image src={cat4} alt="Cat eating food" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat1} alt="Cat eating a treat" draggable="false"/>
    </CarouselItem>
</Carousel>
```

## Example of Looping Carousel

```jsx
const cat1 = 'http://media2.popsugar-assets.com/files/thumbor/' +
    'DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-' +
    ':strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16' +
    '594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemad' +
    'e-Salmon-Popsicle-Cat-Treat.jpg';
const cat2 = 'https://s-media-cache-ak0.pinimg.com/564x/72/4b/6d/724b6d' +
    'bf91c378a53d6890bb525c1aa9.jpg';
const cat3 = 'https://s-media-cache-ak0.pinimg.com/564x/af/f7/43/aff743' +
    '479fc29789d2231329453b1abc.jpg';
const cat4 = 'http://res.cloudinary.com/monsterpetsupplies/image/upload/' +
    'c_pad,w_500,h_500/v1456507382/Product/Boris_Side_On_Eating_Sealed_' +
    'Pet_Bowl_2.jpg';
const cat5 = 'https://images.pexels.com/photos/979503/pexels-photo-979503.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=500';

<Carousel
    previousIcon="chevron-left"
    nextIcon="chevron-right"
    iconSize="medium"
    buttonClass="pw--secondary"
    allowLooping
>
    <CarouselItem>
        <Image src={cat1} alt="Cat eating a treat" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat2} alt="Cat looking at the camera" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat5} alt="Cat in profile" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat3} alt="Two cats cuddling" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat4} alt="Cat eating food" draggable="false"/>
    </CarouselItem>
</Carousel>
```

## Example With Slides as Links

```jsx
const cat1 = 'http://media2.popsugar-assets.com/files/thumbor/' +
    'DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-' +
    ':strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16' +
    '594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemad' +
    'e-Salmon-Popsicle-Cat-Treat.jpg';
const cat4 = 'http://res.cloudinary.com/monsterpetsupplies/image/upload/' +
    'c_pad,w_500,h_500/v1456507382/Product/Boris_Side_On_Eating_Sealed_' +
    'Pet_Bowl_2.jpg';

<Carousel
    previousIcon="chevron-left"
    nextIcon="chevron-right"
    iconSize="medium"
    buttonClass="pw--secondary"
>
    <CarouselItem href={cat4}>
        <Image src={cat4} alt="Cat eating food" draggable="false" />
    </CarouselItem>

    <CarouselItem href={cat1}>
        <Image src={cat1} alt="Cat eating a treat" draggable="false" />
    </CarouselItem>
</Carousel>
```

## Example with arbitrary content
```jsx
const product1 = 'https://www.merlinspotions.com/media/catalog/product/' +
    'cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/' +
    'e/y/eye-of-newt-1.jpg';
const product2 = 'https://www.merlinspotions.com/media/catalog/product/' +
    'cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/' +
    'u/n/unicorn-blood-1.jpg';
const product3 = 'https://www.merlinspotions.com/media/catalog/product/' +
    'cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/' +
    'a/g/aging-potion-1.jpg';
const product4 = 'https://www.merlinspotions.com/media/catalog/product/' + 
    'cache/1/small_image/240x300/beff4985b56e3afdbeabfc89641a4582/' +
    'd/r/dragon-tonic-1.jpg';

<div>
    <h3>Recommended Products</h3>
    <Carousel
        previousIcon="chevron-left"
        nextIcon="chevron-right"
        iconSize="medium"
        buttonClass="pw--secondary"
    >
        <CarouselItem>
            <div className="u-text-height-single u-flexbox">
                <div className="u-flex">
                    <Image src={product1} alt="Eye of Newt" draggable="false" />
                    <div>Eye of Newt</div>
                    <Price className="u-margin-top-sm" current="$12.00" />
                </div>

                <div className="u-flex">
                    <Image src={product2} alt="Unicorn Blood" draggable="false" />
                    <div>Unicorn Blood</div>
                    <Price className="u-margin-top-sm" current="$20.00" previous="$25.00" />
                </div>
            </div>
        </CarouselItem>

        <CarouselItem>
            <div className="u-text-height-single u-flexbox">
                <div className="u-flex">
                    <Image src={product3} alt="Aging Potion" draggable="false" />
                    <div>Aging Potion</div>
                    <Price className="u-margin-top-sm" current="$25.00" />
                </div>

                <div className="u-flex">
                    <Image src={product4} alt="Dragon Tonic" draggable="false" />
                    <div>Dragon Tonic</div>
                    <Price className="u-margin-top-sm" current="$60.00" />
                </div>
            </div>
        </CarouselItem>
    </Carousel>
</div>
```

## Example With Custom Internal Controls

```jsx
const initialState = { currentSlide: 0 };
const updateState = (slideIndex) => {
    if (slideIndex === state.currentSlide) { return; }
    setState({currentSlide: slideIndex})
};
const next = () => { updateState(state.currentSlide + 1) };
const previous = () => { updateState(state.currentSlide - 1) };
const start = () => { updateState(0) };
const end = () => { updateState(3) };

<Carousel
    onSlideMove={updateState}
    currentSlide={state.currentSlide}
    previousIcon="chevron-left"
    nextIcon="chevron-right"
    iconSize="medium"
    buttonClass="pw--secondary"
>
    <CarouselItem>
        <Button onClick={next} className="pw--primary">
            Next <Icon name="caret-right" />
        </Button>
        <Button onClick={end} className="pw--secondary">
            To the END
        </Button>
    </CarouselItem>

    <CarouselItem>
        <Button onClick={previous} className="pw--primary">
            <Icon name="caret-left" /> Back
        </Button>
        <Button onClick={next} className="pw--primary">
            Next <Icon name="caret-right" />
        </Button>
    </CarouselItem>

    <CarouselItem>
        <Button onClick={previous} className="pw--primary">
            <Icon name="caret-left" /> Back
        </Button>
        <Button onClick={next} className="pw--primary">
            Next <Icon name="caret-right" />
        </Button>
    </CarouselItem>

    <CarouselItem>
        <Button onClick={previous} className="pw--primary">
            <Icon name="caret-left" /> Back
        </Button>
        <Button onClick={start} className="pw--secondary">
            To the START
        </Button>
    </CarouselItem>
</Carousel>
```

## Example of Hiding Controls

*With no pips and no controls*

```jsx
const cat1 = 'http://media2.popsugar-assets.com/files/thumbor/' +
    'DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-' +
    ':strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16' +
    '594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemad' +
    'e-Salmon-Popsicle-Cat-Treat.jpg';
const cat4 = 'http://res.cloudinary.com/monsterpetsupplies/image/upload/' +
    'c_pad,w_500,h_500/v1456507382/Product/Boris_Side_On_Eating_Sealed_' +
    'Pet_Bowl_2.jpg';

<Carousel showControls={false}>
    <CarouselItem>
        <Image src={cat4} alt="Cat eating food" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat1} alt="Cat eating a treat" draggable="false"/>
    </CarouselItem>
</Carousel>
```

*With pips and no controls*

```jsx
const cat1 = 'http://media2.popsugar-assets.com/files/thumbor/' +
    'DBA3mv_owF0E2BoCrH_oaseQick/fit-in/500x500/filters:format_auto-!!-' +
    ':strip_icc-!!-/2015/07/13/281/n/1922243/953ff51d_edit_img_image_16' +
    '594958_1436816964_11378154_1591447017795211_1999564903_n/i/Homemad' +
    'e-Salmon-Popsicle-Cat-Treat.jpg';
const cat4 = 'http://res.cloudinary.com/monsterpetsupplies/image/upload/' +
    'c_pad,w_500,h_500/v1456507382/Product/Boris_Side_On_Eating_Sealed_' +
    'Pet_Bowl_2.jpg';

<Carousel showControls={false} showPips={true}>
    <CarouselItem>
        <Image src={cat4} alt="Cat eating food" draggable="false"/>
    </CarouselItem>

    <CarouselItem>
        <Image src={cat1} alt="Cat eating a treat" draggable="false"/>
    </CarouselItem>
</Carousel>
```
