# Design

## Related Components

- [Field](#!/Field)
- [FieldRow](#!/FieldSet)

## UI Kit

![](../../assets/images/components/field-set/fieldset-uikit.png)

*Symbol Path: form -> Field*

## Purpose

FieldSet is used to group fields together that relate to the submission of a form. It is possible to have multiple FieldSets on a single template.

## Appropriate Uses

- Whenever a form contains separate sets of data that submit irrelevant of each other.
- To split the login/register forms on a single Sign In template.
- To group the different parts of a checkout form such as Shipping Address and Shipping Method.

## User Interactions

- FieldSet contains no interactions separate from that of the [Field component](#!/Field).
- A single action can be used to submit data from a specified FieldSet.

## Usage Tips & Best Practices

- FieldSet is a tool primarily used by developers to separate form submits.
- Ensure the submit button shown to the user is clearly relating to the fieldset (e.g a button should never read "Login or Register" it should change from Login to Register depending on the fieldset it references).

## Accessibility
- Ensure FieldSets are clearly shown/hidden depending on the action the user is performing (e.g. if a user chooses Register instead of Login, the Login set of fields should no longer be in view).

## Example Implementations

### Lancome (Log in or Create account):

![](../../assets/images/components/field-set/fieldset-lancome.gif)

### Merlin's Potions (shipping address and shipping method):

![](../../assets/images/components/field-set/fieldset-merlins.png)
