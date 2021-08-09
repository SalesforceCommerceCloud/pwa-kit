# Design

## Component group

- [ProgressSteps](#!/ProgressSteps)
- [ProgressStepsItem](#!/ProgressStepsItem)

## UI Kit

![](../../assets/images/components/progress-steps/progresssteps-uikit.png)

*Symbol Path: general -> ProgressSteps*

## Purpose

Provides the user with a visual indicator of where they are currently at in a numbered step flow and how far they have to go.

## Appropriate Uses

- Most commonly within the checkout flow at the top of each page.
- Within a configuration flow.
- Any flow that has a set number of tasks to completion, where each task is a different page.

## User Interactions

- The user can on tap on completed steps to navigate back and make changes to a that step.
- Interaction is disabled on steps that are yet to be reached.

## Usage Tips & Best Practices

- ProgressStepsItems always have an active, completed and disabled state.
- Typically a progress step will contain the name of the step and either a supporting icon or a number to indicate the step.
- Favor using icons where the number of steps is low and easy to comprehend. Consider using numbers when the number of steps is greater than 4.
- A [badge](#!/Badge) component can be utilized in order to add a check mark to a completed step. However, in testing this has been known to reduce the user's understanding that they can interact with this step go back.
- Any ProgressStep that includes more than 5 items will prove difficult to space out on smaller screen sizes. Designers should attempt to consolidate tasks into no more than 4/5 steps.
- It is important to include a "Complete" step at the end. This helps the user understand where the end is.

## Accessibility

- Do not rely solely on color/opacity changes to differentiate states. Additional states such as borders or bold text can be utilized to help colorblind users understand the step they are on.
- Do not rely solely on icons to describe the step. Always back up the icons with a text label.
- Space is often at a premium in ProgressSteps, label text size can help keep the layout clean however, do not allow the text size to fall below 8px.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/components/progress-steps/progresssteps-merlins.png)

### Paula's Choice:

![](../../assets/images/components/progress-steps/progresssteps-paulas.png)
