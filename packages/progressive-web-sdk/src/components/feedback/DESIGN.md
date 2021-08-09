# Design

## UI Kit

![](../../assets/images/components/feedback/feedback-uikit.png)

*Symbol Path: general -> Feedback*

## Purpose

Feedback is used within a page template to provide information on a successful or unsuccessful form submission.

## Appropriate Uses

- As a block at the top of the page to provide success/failure messaging of an entire form submission.
- Inline throughout a form to provide valid/invalid messaging around individual inputs.

## User Interactions

- Feedback typically provides contextual information and does not contain any interactive elements.

## Usage Tips & Best Practices

- Typically there are 2 states; success and failure.
- Valid/invalid messaging can be backed up with visual indicators such as icons and color to draw attention and give clear context.
- Inline feedback should appear next to (usually below) the affected field.
- Inline feedback should be contextual and clearly describe the issue (e.g. Not a valid email address).
- Block feedback normally appears at the top or bottom of the form and contains information about the submission in general (e.g. Form not submitted).

## Accessibility
- Do not solely rely on color to indicate success/failure, use clear messaging and add iconography.
- Blocks work well when they are a tint of the error/success color, however beware of using red-on-red or green-on-green as this is not accessible. [Use this handy tool](http://www.contrastchecker.com) to test contrast.

## Example Implementations

### Lancome (inline)

![](../../assets/images/components/feedback/feedback-lancome.png)

### Paula's Choice (block)

![](../../assets/images/components/feedback/feedback-paulas.png)
