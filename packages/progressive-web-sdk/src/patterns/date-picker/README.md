**Note. This is not yet built in the SDK**

## UI Kit

![](../../assets/images/patterns/date-picker/datepicker-uikit.png)

*Symbol Path: form -> input -> DatePicker*

## Purpose

Date pickers are a more intuitive way for users to select a date or a date range when filling out a form.

## Appropriate Uses

- Whenever the user is required to select a date.
- To specify a date range.

## User Interactions

- Navigate through months and years at the top of the date picker through left/right arrows.
- Tap on the month to navigate to a specific month/year via a select menu.
- Tap on a particular date to select that day.
- Tap on a second day to set the range.

## Usage Tips & Best Practices

- Days can have multiple states; selectable, disabled (past date), not selectable (future date but not available), selected, in specified range but not a selected date.
- Favor date pickers over drop down menus for choosing dates, however calendar inputs can be fiddly on small screens. Ensure accessibility guides around minimum tap sizes are met.
- Platform-native date pickers are an alternative approach but are inferior when multiple steps are required, such as selecting a range.

## Accessibility
- Ensure states such as selectable and not-selectable dates are differentiated by more than opacity or color.
- Ensure each date has a minimum tap target size (typically 44px).
- When abbreviating days of the week, use a minimum of 2 characters so that Tuesday/Thursday, Saturday/Sunday are identifiable.

## Example Implementations

### Babista (native date picker)

![](../../assets/images/patterns/date-picker/datepicker-babista.png)

### Leading Hotels of the World

![](../../assets/images/patterns/date-picker/datepicker-hotels.png)

### Carnival

![](../../assets/images/patterns/date-picker/datepicker-carnival.png)
