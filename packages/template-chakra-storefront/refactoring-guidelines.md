# Translations refactoring guidelines

You are a senior software engineer who is specialized in building React.js application and writes clean and maintainable code.

I need you to refactor the codebase at a large scale. I've created a checklist in ./refactoring-checklist.md

The checklist contains a list of file paths that we will go over one by one, once you finished refactoring one file, check it off and git commit the file with a commit message "refactor translations in {RELATIVE_FILE_PATH}", continue to the next file. At the end of the refactoring work, we should see all files checked off from the ./refactoring-checklist.md file.

git commit format
```sh
git add --all
git commit -m "refactor translations in {RELATIVE_FILE_PATH}"

# when you go over a file and that file requires no changes, do
git add --all
git commit -m "update refactoring-checklist.md" # do not co-sign the commit or change the commit message
```

Here is the task: we are going to standardize the translation implementation inside all React.js components.

Currently the translation definitions are cluttered inside the JSX definitions and making it hard to read and understand the structure of react component's JSX. We are going to extract the translation out from the JSX and move them into the render method. Below are examples.

Do not change anything else other than the refactoring translation definition task. 

If you are uncertain about some code, pause and ask me about it.

remember to never change the actual functionality, no renaming of variables or translation labels. Also do not add comments.

Make the code consistent through out the code base, if there are <FormattedMessage > component usage that can be replaced to follow the same pattern, do it, however, never change the react app functionality because we don't want to test the entire app with the changes. Only code style change. Replacing `FormattedMessage` component is the only exception for code functionaility change, we want to avoid having two different patterns.

Also, no `formatMessage` inside the JSX code, always extract them out.

always use `const {formatMessage} = useIntl()` to deconstruct intl object, instead of calling intl.formatMessage every where.

## BAD EXAMPLE

```jsx
const ProductListModal = ({isOpen, onClose, productCount}) => {
    const {formatMessage} = useIntl()
    
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader>
                <Heading as="h1" fontWeight="bold" fontSize="2xl">
                    {formatMessage({
                        defaultMessage: "Filter",
                        id: "product_list.modal.title.filter"
                    })}
                </Heading>
            </ModalHeader>
            <ModalBody>
                <Text>
                    {formatMessage({
                        defaultMessage: "Select filters to narrow down your search results",
                        id: "product_list.modal.description"
                    })}
                </Text>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose}>
                    {formatMessage({
                        id: 'product_list.modal.button.view_items',
                        defaultMessage: 'View {productCount} items'
                    }, {
                        productCount: productCount
                    })}
                </Button>
                <Button variant="outline" onClick={resetFilters}>
                    {formatMessage({
                        defaultMessage: "Clear Filters",
                        id: "product_list.modal.button.clear_filters"
                    })}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

// JSX is cluttered and hard to read due to inline message definitions
// Component structure is obscured by i18n boilerplate
// Messages are scattered throughout the component
// Difficult to see the actual UI structure
```

## GOOD EXAMPLE

```jsx
const ProductListModal = ({isOpen, onClose, productCount, onResetFilters}) => {
    const {formatMessage} = useIntl()
    
    // Group related messages together
    const messages = {
        title: formatMessage({
            id: "product_list.modal.title.filter",
            defaultMessage: "Filter"
        }),
        description: formatMessage({
            id: "product_list.modal.description",
            defaultMessage: "Select filters to narrow down your search results"
        }),
        buttons: {
            viewItems: formatMessage({
                id: 'product_list.modal.button.view_items',
                defaultMessage: 'View {productCount} items'
            }, { productCount }),
            clearFilters: formatMessage({
                id: "product_list.modal.button.clear_filters", 
                defaultMessage: "Clear Filters"
            })
        }
    }
    
    // Clean, readable JSX
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader>
                <Heading as="h1" fontWeight="bold" fontSize="2xl">
                    {messages.title}
                </Heading>
            </ModalHeader>
            <ModalBody>
                <Text>{messages.description}</Text>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose}>
                    {messages.buttons.viewItems}
                </Button>
                <Button variant="outline" onClick={onResetFilters}>
                    {messages.buttons.clearFilters}
                </Button>
            </ModalFooter>
        </Modal>
    )
}
```

===============================================
The above migration is done. However, we missed a detail that we need to go back and fix again.

We need to wrap the `messages` variable in `useMemo` to improve performance.

Don't forget to import useMemo.

Example:

```
import React, { useMemo } from 'react'

// example
const messages = useMemo(() => ({
        header: {
            title: intl.formatMessage({
                id: 'drawer_menu.header.assistive_msg.title',
                defaultMessage: 'Menu Drawer'
            })
        },
        links: {
            shopAll: intl.formatMessage({
                id: 'drawer_menu.link.shop_all',
                defaultMessage: 'Shop All'
            }),
            signIn: intl.formatMessage({
                id: 'drawer_menu.link.sign_in',
                defaultMessage: 'Sign In'
            })
        },
        buttons: {
            logOut: intl.formatMessage({
                id: 'drawer_menu.button.log_out',
                defaultMessage: 'Log Out'
            })
        }
    }), [intl])
```