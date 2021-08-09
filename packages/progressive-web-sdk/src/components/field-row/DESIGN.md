# Design

## Related Components

- [Field](#!/Field)
- [FieldSet](#!/FieldSet)

## UI Kit

![](../../assets/images/components/field-row/fieldrow-uikit.png)

*Symbol Path: form -> Field*

## Purpose

FieldRow is used to group multiple fields on one line. It is a useful tool for saving vertical space, making forms appear less cumbersome and visually grouping similar datasets.

## Appropriate Uses

- Wherever two fields can be placed together on one line, so long as they will both be capturing a small number of characters.
- On the payment step of the checkout to group Expiry and Security code.
- On the shipping step of checkout to group Title and First Name.
- FieldRow can be used to space out any combination of input components; text fields, radio buttons, checkboxes etc.

## User Interactions

- FieldRow contains no interactions separate from that of the [Field component](#!/Field).

## Usage Tips & Best Practices

- Each field used in FieldRow will have the same attributes as the Field component, including hint text and inline messages. Be aware that these messages may cause spacing issues if activated.
- Fields can be spaced at the designers discretion. This should reflect the amount on context expected in each input.
- If the expected input is longer then the size of the input at smallest screen size (typically 320px) then FieldRow is not recommended.

## Accessibility
- Inputs should be sized to reflect the amount of context expected. If an input is sized incorrectly then this can cause confusion as to what data the user is expected to input.

## Example Implementations

### Babista:

![](../../assets/images/components/field-row/fieldrow-babista.png)

### Paula's Choice:

![](../../assets/images/components/field-row/fieldrow-paulas.png)
