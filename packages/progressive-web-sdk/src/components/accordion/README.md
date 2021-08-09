```js static
// JS import
import {Accordion, AccordionItem} from 'progressive-web-sdk/dist/components/accordion'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/accordion/base';
```


## Example Usage

```jsx
<Accordion>
    <AccordionItem header="Accordion Item #1" id="1">
        <div>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
        </div>
    </AccordionItem>
</Accordion>
```


## Example With `prerender`

```jsx
<Accordion prerender>
    <AccordionItem header="Accordion Item #1" id="1">
        <div>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old test.
        </div>
    </AccordionItem>
</Accordion>
```

## Example Of Lifecycle Callbacks

| Order | <span style="white-space: nowrap;">Open Callbacks</span> | Explanation |
| --- | --- | --- |
| 1 | `onOpen`  | Triggered by the user clicking on header (AccordionItem). onOpen function is called with item's id passed to it. |
| 2 | `onOpened`        | Triggered after accordion is done opening. |

| Order | Close Callbacks | Explanation |
| --- | --- | --- |
| 1 | `onClose`     | Triggered by the user clicking on opened header (AccordionItem). onClose function is called with item's id passed to it! |
| 2 | `onClosed` | Triggered after accordion is done closing. |

If these functions are provided directly to 'AccordionItem', it will override the ones passed to the 'Accordion'

```jsx
<Accordion
    onOpen={() => {alert('Accordion is opening')}}
    onOpened={() => {alert('Accordion is open')}}
    onClose={() => {alert('Accordion is closing')}}
    onClosed={() => {alert('Accordion is closed')}}
>
    <AccordionItem header="Accordion Item" id="1">
        <div>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
        </div>
    </AccordionItem>
</Accordion>
```


## Example With Nested Accordions

```jsx
<Accordion>
    <AccordionItem header="Accordion Item" id="1">
        <div className="u-margin-bottom-lg">Lorem Ipsum dolor sit amet</div>
        <Accordion>
            <AccordionItem header="Accordion Nested Item #1" closeIconName="x" id="inner-1">
                Lorem Ipsum
            </AccordionItem>
            <AccordionItem header="Accordion Nested Item #2" closeIconName="x" id="inner-2">
                Lorem Ipsum
            </AccordionItem>
        </Accordion>
    </AccordionItem>
</Accordion>
```


## Example With Different Icons

```jsx
<Accordion>
    <AccordionItem
        header="Accordion Item #1"
        openIconName="caret-bottom"

        closeIconName="caret-top"
        iconPosition="end"
        id="1"
    >
        <div>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
        </div>
    </AccordionItem>
    <AccordionItem
        header="Accordion Item #2"
        openIconName="caret-bottom"

        closeIconName="caret-top"
        iconPosition="end"
        id="2"
    >
        <div>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
        </div>
    </AccordionItem>
</Accordion>
```

## Example With Open/Close All Buttons

```jsx
let accordion;

<div>
    <div className="u-flexbox">
        <Button className="u-flex u-margin-end-sm"  onClick={() => accordion.openAllItems()}>
            Open All
        </Button>
        <Button className="u-flex" onClick={() => accordion.closeAllItems()}>
            Close All
        </Button>
    </div>
    <Accordion ref={(el) => { accordion = el }}>
        <AccordionItem
            header="Accordion Item #1"
            openIconName="caret-bottom"

            closeIconName="caret-top"
            iconPosition="end"
            id="1"
        >
            <div>
                Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
            </div>
        </AccordionItem>
        <AccordionItem
            header="Accordion Item #2"
            openIconName="caret-bottom"

            closeIconName="caret-top"
            iconPosition="end"
            id="2"
        >
            <div>
                Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
            </div>
        </AccordionItem>
    </Accordion>
</div>
```

## Example With Open Item/Close Item Buttons

Each `AccordionItem` requires an `id` prop. This `id` can be used to open/close that accordion item using the `Accordion`'s `openItem` and `closeItem` functions.

| Method | Explanation |
| --- | --- |
|`openItem(id)`  | `id`: the `id` of the `AccordionItem` to be opened |
|`closeItem(id)` | `id`: the `id` of the `AccordionItem` to be closed |

```jsx
let accordion;

<div>
    <div className="u-flexbox">
        <Button className="u-flex u-margin-end-sm"  onClick={() => accordion.openItem('first-item')}>
            Open First Item
        </Button>
        <Button className="u-flex" onClick={() => accordion.closeItem('first-item')}>
            Close First Item
        </Button>
    </div>
    <Accordion ref={(el) => { accordion = el }}>
        <AccordionItem
            header="Accordion Item #1"
            openIconName="caret-bottom"
            closeIconName="caret-top"
            iconPosition="end"
            id="first-item"
        >
            Lorem Ipsum
        </AccordionItem>
        <AccordionItem
            header="Accordion Item #2"
            openIconName="caret-bottom"
            closeIconName="caret-top"
            iconPosition="end"
            id="second-item"
        >
            Lorem Ipsum
        </AccordionItem>
    </Accordion>
</div>
```

## Example to Adjust Open/Close Animation

```jsx
<Accordion duration={150} easing="ease-out">
    <AccordionItem
        header="Accordion Item #1"
        openIconName="caret-bottom"
        closeIconName="caret-top"
        iconPosition="end"
        id="1"
    >
        <div>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
        </div>
    </AccordionItem>
    <AccordionItem
        header="Accordion Item #2"
        openIconName="caret-bottom"
        closeIconName="caret-top"
        iconPosition="end"
        id="2"
    >
        <div>
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
        </div>
    </AccordionItem>
</Accordion>
```
