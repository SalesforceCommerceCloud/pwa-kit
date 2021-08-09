// Search script
// ===
//
// This script adds search filtering functionality to the JSdoc function list
// sidebar. This depends on the third party List.js library, and is styled by
// docs/public/assets/styles/search.css

;(function(List) {
    var utilitiesId = 'utilities'
    var utilityFunctionClass = 'utility-function'
    var utilities = document.getElementById(utilitiesId)
    var list = utilities.getElementsByTagName('ul')[0]
    var link = utilities.getElementsByTagName('a')

    if (list) {
        list.setAttribute('class', 'list')
    } else {
        var searchField = document.getElementsByClassName('search')[0]

        // Remove search field and add console.error if list does not exist
        searchField.parentNode.removeChild(searchField)
        console.error('The list for search filter does not exist in DOM')
    }

    for (var item in link) {
        var listItem = link[item]

        // Check to make sure the listItem is an HTML node then it can use
        // `setAttribute` method.
        if (listItem instanceof HTMLElement) {
            // Set listItem class name so List.js search can be used
            listItem.setAttribute('class', utilityFunctionClass)
        }
    }

    // List.js API
    // ---
    var userList = new List(utilitiesId, {valueNames: [utilityFunctionClass]})

    // If nothing appears in the search then it will insert a "not found" item to list
    document.getElementsByClassName('search')[0].addEventListener('keyup', (event) => {
        if (userList.matchingItems.length === 0) {
            list.innerHTML = '<li>Search results: No utility functions found</li>'
        }
    })
})(List)
