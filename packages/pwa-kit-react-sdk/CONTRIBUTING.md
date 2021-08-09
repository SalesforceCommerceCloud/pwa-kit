# Contributing to Progressive Web

Communication happens in the **#progressive-web** Slack room.

We use two Jira boards to manage work: [Web FE](https://mobify.atlassian.net/secure/RapidBoard.jspa?rapidView=115) 
and [Web Data](https://mobify.atlassian.net/secure/RapidBoard.jspa?rapidView=244).  

When contributing a PR to the Progressive Web SDK, please branch off of `develop` and 
open up a pull request.

## Coding Guidelines

The following section sets out some guidelines for code being submitted to the
Progressive Web SDK.  These are not hard-and-fast rules but rather guidelines that
help to make for a consistent and easy-to-learn codebase.

### JavaScript

We write ES6 wherever we can. Our SDK contains linting to help you follow our
guidelines, [which can be found here](https://github.com/mobify/mobify-code-style/tree/develop/es6)

## Component Documentation Guidelines

Below we cover what type of documentation each component should include, and what details must be included.

### `propTypes`

In the same file that defines the component's structure and functionality, its `propTypes` must also be described. The following are required:

* `propTypes` object that describes that datatypes of each prop
* If any `propTypes` are required, their defaults must be described
* Javascript comment that briefly describes each `propType`

The above items are required for our automated documentation generation tool to work.

### `README.md`

Our automated documentation generation tool, Styleguidist, is limited in its capabilities. Only certain aspects of the documentation can be generated automatically, such as `propTypes` (see above). The rest must be manually added into the `README.md` file.

At the very least, the following is expected to be included:

* A brief (one paragraph) description that describes in plain english what the purpose and general use case this component serves
* An example usage of the component in its most simple state
* A code snippet that imports the component into a JS script
* Detailed explanation of how advanced props work, possibly with more code examples
* If a `propType` is complex or requires multiple choices, such as with `PropTypes.shape` or `PropTypes.oneOf`, provide a full explanation
