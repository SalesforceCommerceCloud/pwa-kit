```js static
// JS import
import {ProgressSteps, ProgressStepsItem} from 'progressive-web-sdk/src/components/progress-steps'

// SCSS import
@import 'node_modules/progressive-web-sdk/src/components/progress-steps/base';
```


## Example Usage

```jsx
<ProgressSteps>
    <ProgressStepsItem title="Shipping" href="#" />
    <ProgressStepsItem title="Payment" href="#" />
    <ProgressStepsItem title="Review" href="#" current />
    <ProgressStepsItem title="Complete" href="#" />
</ProgressSteps>
```

## Example With Icons

```jsx
<ProgressSteps>
    <ProgressStepsItem title="Shipping" href="#" icon="shipping" />
    <ProgressStepsItem title="Payment" href="#" icon="payment" />
    <ProgressStepsItem title="Review" href="#" icon="review" current />
    <ProgressStepsItem title="Complete" href="#" icon="check" />
</ProgressSteps>
```

## Example with disableIncompleteSteps

```jsx
<ProgressSteps disableIncompleteSteps>
    <ProgressStepsItem title="Shipping" href="#" icon="shipping" />
    <ProgressStepsItem title="Payment" href="#" icon="payment" current />
    <ProgressStepsItem title="Review" href="#" icon="review" />
    <ProgressStepsItem title="Complete" href="#" icon="check" />
</ProgressSteps>
```

## Example with onClick

```jsx
initialState = {currentStep: 3};

const updateStep = (step) => () => setState({currentStep: step});
const isCurrent = (step) => state.currentStep === step;

<ProgressSteps>
    <ProgressStepsItem
        onClick={updateStep(0)}
        current={isCurrent(0)}
        title="Shipping"
        icon="shipping"
    />
    <ProgressStepsItem
        onClick={updateStep(1)}
        current={isCurrent(1)}
        title="Payment"
        icon="payment"
    />
    <ProgressStepsItem
        onClick={updateStep(2)}
        current={isCurrent(2)}
        title="Review"
        icon="review"
    />
    <ProgressStepsItem
        onClick={updateStep(3)}
        current={isCurrent(3)}
        title="Complete"
        icon="check"
    />
</ProgressSteps>
```
