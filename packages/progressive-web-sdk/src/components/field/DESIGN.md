# Design

## Related Components

- [FieldRow](#!/FieldRow)
- [FieldSet](#!/FieldSet)
- [Feedback](#!/Feedback)

## UI Kit

![](../../assets/images/components/field/field-uikit.png)

*Symbol Path: form -> Field*

## Purpose

Fields are used to create Form UI and allow the capturing of user inputted data.

## Appropriate Uses

- Anywhere a user is required to provide information to the site.
- Within the checkout pages to capture shipping and payment information.
- To obtain username and password information in order to sign in.
- This component is used for all form field components including text fields, select menus, radio buttons and check boxes.

## User Interactions

- A tap on an enabled field should always trigger an interaction.
- Tapping on an input field will typically trigger a native keyboard.
- Tapping on a select field will typically trigger the native select menu.
- Tapping on a checkbox field will toggle the option on or off.
- Tapping on an inactive radio button will toggle that action on and the previously active option off.

## Usage Tips & Best Practices

- Users do not like filling out forms, therefore all fields in a form should be required. Any fields that are not required should be marked using the hint text as "Optional".
- All text fields should be accompanied by a label.
- Use placeholder content in text input fields to help the user understand what kind of data is expected.
- Valid/invalid messaging can be backed up with visual indicators such as icons and color to draw attention and give clear context.
- Inline feedback should appear next to (usually below) the affected field.
- Inline feedback should be contextual and clearly describe the issue (e.g. Not a valid email address).
- Block feedback normally appears at the top or bottom of the form and contains information about the submission in general (e.g. Form not submitted).
- When a field has an error, it is helpful to mark that form label using a color and/or an icon.
- When using a radio button, the first option should be selected by default.
- Use a check button when the user is required to select multiple options.
- Use the hint part of the component if the capturing of a field needs further explanation (e.g. explain why a checkout form is asking for the user's phone number)

## Accessibility
- Screen readers do not pick up placeholder text in the same way form labels are read. Do not use placeholder text in place of form labels.
- Ensure form fields meet minimum tap target size (typically 44px).
- Do not rely solely on opacity or color changes to differentiate active from disabled form fields.
- Placeholder text should be a different color/style to input text, yet high enough in contrast to pass accessibility guides. [Use this handy tool](http://www.contrastchecker.com) to test contrast.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/components/field/field-merlins.png)

### Paula's Choice:

![](../../assets/images/components/field/field-paulas.png)
