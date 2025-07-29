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
git commit -m "update refactoring-checklist.md"
```

Here is the task: we are going to standardize the translation implementation inside all React.js components.

Currently the translation definitions are cluttered inside the JSX definitions and making it hard to read and understand the structure of react component's JSX. We are going to extract the translation out from the JSX and move them into the render method. Below are examples.

Do not change anything else other than the refactoring translation definition task. 

If you are uncertain about some code, pause and ask me about it.

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
