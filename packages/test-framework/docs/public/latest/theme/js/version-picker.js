function versionPicker(baseUrl, pathArray, changelogPath, currentVersion) {
    // remove version # from path and then create the path string
    var absoluteUrl = pathArray
        .split(',')
        .slice(1)
        .join('/')
        .replace('index', '')
    var versionsJsonUrl = baseUrl + 'versions.json'
    var releaseDatesJsonUrl = baseUrl + 'release-dates.json'
    var $versionPickerButton = $('button#version-picker')
    var $versionPickerList = $('ul#version-picker-versions')
    var $versionPickerCaret = $('#version-picker-caret')

    var getVersionLabel = function(version, isLatest) {
        return isLatest ? 'v' + version + ' latest' : 'v' + version
    }

    $versionPickerButton.click(function() {
        $versionPickerButton.addClass('active')
        $versionPickerCaret.addClass('active')
        $versionPickerList.slideDown(300, 'easeInOutExpo')
    })

    $versionPickerList.click(function() {
        $versionPickerList.slideUp(300, 'easeInOutExpo')
        $versionPickerButton.removeClass('active')
        $versionPickerCaret.removeClass('active')
    })

    var createItem = function(label, releaseDate, link, isSelected) {
        var $item = $('<li class="c-version-picker__item">')
        if (releaseDate !== '' && releaseDate !== undefined) {
            var $link = $(
                '<a class="c-version-picker__link">' + label + ' (' + releaseDate + ')' + '</a>'
            )
        } else {
            var $link = $('<a class="c-version-picker__link">' + label + '</a>')
        }
        if (isSelected) {
            $item.addClass('c--selected')
        } else {
            $link.attr('href', link)
        }

        $item.append($link)

        $versionPickerList.append($item)
    }

    $.get(releaseDatesJsonUrl).always(function(dates) {
        $.get(versionsJsonUrl, function(versions) {
            var numDisplayVersions = versions.length > 10 ? 10 : versions.length
            for (var i = 0; i < numDisplayVersions; i++) {
                var version = versions[i]
                var isLatest = i === 0
                var isSelected =
                    version === currentVersion || (isLatest && currentVersion === 'latest')
                var versionLabel = getVersionLabel(version, isLatest)
                var releaseDate = dates[version]
                createItem(
                    versionLabel,
                    releaseDate,
                    baseUrl + version + '/' + absoluteUrl,
                    isSelected
                )

                if (isSelected) {
                    $versionPickerButton.text(getVersionLabel(version, isLatest))
                }

                if (isLatest) {
                    $versionPickerButton.addClass('is--latest')
                }
            }

            // Once we've built all the markup, show the caret icon
            // This also means if the versions JSON fails to load - users won't see
            // a broken version picker
            $versionPickerButton.addClass('is--loaded')

            if (versions.length > 10) {
                createItem('Changelog', '', baseUrl + changelogPath)
            }

            // If the selected version is older than the first 10, it won't be in the list
            // and our button label won't be setup
            if ($versionPickerButton.text().length < 1) {
                $versionPickerButton.text(getVersionLabel(currentVersion, false))
            }

            $versionPickerButton.show()
        })
    })
}
