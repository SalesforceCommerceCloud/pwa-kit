/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import classNames from 'classnames'
import IconLabel from '../../icon-label'
import Carousel from '../../carousel'
import CarouselItem from '../../carousel/carousel-item'

const STATUS = {
    COPY_ERROR: 'COPY_ERROR',
    EMAIL_ERROR: 'EMAIL_ERROR', // no way to know if mailto: failed.
    PRINT_ERROR: 'PRINT_ERROR',
    SHARE_ERROR: 'SHARE_ERROR'
}

// The props from the Sheet component pass directly to SheetContent,
// making propType validation redundant.
/* eslint-disable react/prop-types */
// All props inherited from parent on this private component.

const generateSharePages = ({shareOptions, optionsPerCol, optionsPerRow}) => {
    const optionPages = []
    const optionsPerPage = optionsPerCol * optionsPerRow
    const numShareOptionPages = Math.ceil(shareOptions.length / optionsPerPage)
    const iconSize = 'x-large'

    for (let i = 0; i < numShareOptionPages; i++) {
        const optionColumns = []
        const columnElements = []

        // Create columns
        for (let j = 0; j < optionsPerRow; j++) {
            optionColumns.push([])
        }

        // Fill columns
        for (
            let k = i * optionsPerPage;
            k < shareOptions.length && k < (i + 1) * optionsPerPage;
            k++
        ) {
            const option = shareOptions[k]
            const shareOptionClasses = classNames('pw-share__option', option.class)
            optionColumns[k % optionsPerRow].push(
                <button
                    className={shareOptionClasses}
                    key={`option-${k}`}
                    onClick={option.onClick}
                    data-analytics-name={option.analyticsName}
                    type="button"
                >
                    <IconLabel
                        className="pw-share__option-icon"
                        label={option.label}
                        iconName={option.iconName}
                        iconSize={iconSize}
                    />
                </button>
            )
        }

        for (let l = 0; l < optionColumns.length; l++) {
            columnElements.push(
                <div key={`option-column-${l}`} className="pw-share__option-column">
                    {optionColumns[l]}
                </div>
            )
        }

        optionPages.push(
            <CarouselItem key={`share-page-wrapper-${i}`}>
                <div className="pw-share__sheet-page u-flex u-flexbox u-direction-row u-justify-around">
                    {columnElements}
                </div>
            </CarouselItem>
        )
    }

    return optionPages
}

const copyContentToClipboard = (el) => {
    if (typeof document.execCommand !== 'function') {
        return false
    }

    // element needs to be visible in order to copy
    el.style.display = 'inherit'
    el.select()
    const success = document.execCommand('copy')
    el.style.display = 'none'
    return success
}

const addUrlShareParams = (url, platform) => {
    let shareUrl
    let shareParams = `share_mobify_id=${window.sandy.instance.getClientID()}&share_medium=${platform}`

    if (url.indexOf('?') === -1) {
        shareParams = `?${shareParams}`
    } else {
        shareParams = `&${shareParams}`
    }

    const hashIndex = url.indexOf('#')
    if (hashIndex !== -1) {
        shareUrl = `${url.substring(0, hashIndex)}${shareParams}${url.substring(hashIndex)}`
    } else {
        shareUrl = `${url}${shareParams}`
    }

    return shareUrl
}

class ShareSheetContent extends React.Component {
    constructor(props) {
        super(props)

        const successHandler = this.successHandler.bind(this)
        const failHandler = this.failHandler.bind(this)

        this.copyHandler = this.copyHandler.bind(this, {successHandler, failHandler})
        this.emailHandler = this.emailHandler.bind(this, {successHandler, failHandler})
        this.printHandler = this.printHandler.bind(this, {successHandler, failHandler})
        this.fbShareHandler = this.shareHandler.bind(this, {
            platform: 'facebook',
            successHandler,
            failHandler
        })
        this.twShareHandler = this.shareHandler.bind(this, {
            platform: 'twitter',
            successHandler,
            failHandler
        })
    }

    copyHandler({successHandler, failHandler}) {
        return copyContentToClipboard(this.textArea)
            ? successHandler({...this.props.shareContent, shareOption: 'copy'})
            : failHandler(STATUS.COPY_ERROR)
    }

    emailHandler({successHandler, failHandler}) {
        if (typeof window.open === 'function') {
            const {shareContent} = this.props
            const subject = shareContent.title
            const body = `${shareContent.url}\n\n${shareContent.text || ''}`

            window.open(encodeURI(`mailto:?subject=${subject}&body=${body}`))
            successHandler({...this.props.shareContent, shareOption: 'email'})
        } else {
            failHandler(STATUS.EMAIL_ERROR)
        }
    }

    printHandler({successHandler, failHandler}) {
        if (typeof window.print === 'function') {
            successHandler({...this.props.shareContent, shareOption: 'print'})
            // We want the sheet to dismiss before the print dialog pops up
            setTimeout(window.print, 25)
        } else {
            failHandler(STATUS.PRINT_ERROR)
        }
    }

    shareHandler({platform, successHandler, failHandler}) {
        let shareUrl
        const url = addUrlShareParams(this.props.shareContent.url, platform)

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                break
            // Twitter
            default:
                shareUrl = `https://twitter.com/share?url=${encodeURIComponent(url)}`
                break
        }

        if (typeof window.open === 'function') {
            window.open(shareUrl)
            successHandler({...this.props.shareContent, shareOption: platform})
        } else {
            failHandler(STATUS.SHARE_ERROR)
        }
    }

    successHandler(shareData) {
        this.props.onDismiss()
        this.props.onSuccess({
            ...shareData,
            url: addUrlShareParams(shareData.url, shareData.shareOption)
        })
    }

    failHandler(error) {
        let errMessage

        switch (error) {
            case STATUS.COPY_ERROR:
                errMessage = "document.execCommand('copy') is not supported."
                break
            case STATUS.PRINT_ERROR:
                errMessage = 'window.print() is not supported.'
                break
            case STATUS.EMAIL_ERROR:
                errMessage = 'failed to open mail client.'
                break
            default:
                errMessage = 'failed to share.'
                break
        }

        console.error(`An error occurred while attempting to share: ${errMessage}`)
        this.props.onFail(error)
        this.props.onDismiss()
    }

    render() {
        const {optionsPerCol, optionsPerRow, shareContent} = this.props

        const classes = classNames('pw-share__sheet-content u-padding-lg')
        const shareOptions = [
            {
                label: 'Copy',
                iconName: 'copy',
                class: 'js-share__copy-option',
                onClick: this.copyHandler,
                analyticsName: 'share_copy'
            },
            {
                label: 'Email',
                iconName: 'email',
                class: 'js-share__email-option',
                onClick: this.emailHandler,
                analyticsName: 'share_email'
            },
            {
                label: 'Print',
                iconName: 'print',
                class: 'js-share__print-option',
                onClick: this.printHandler,
                analyticsName: 'share_print'
            },
            {
                label: 'Facebook',
                iconName: 'social-facebook',
                class: 'js-share__social-option js--facebook-option',
                onClick: this.fbShareHandler,
                analyticsName: 'share_facebook'
            },
            {
                label: 'Twitter',
                iconName: 'social-twitter',
                class: 'js-share__social-option js--twitter-option',
                onClick: this.twShareHandler,
                analyticsName: 'share_twitter'
            }
        ]

        const sharePages = generateSharePages({shareOptions, optionsPerCol, optionsPerRow})
        const showPips = sharePages.length > 1

        return (
            <div className={classes}>
                <Carousel showControls={false} showPips={showPips}>
                    {sharePages}
                </Carousel>

                <textarea
                    readOnly={true}
                    ref={(self) => {
                        this.textArea = self
                    }}
                    style={{display: 'none'}}
                    value={shareContent.url}
                    data-analytics-name="copy"
                />
            </div>
        )
    }
}

export default ShareSheetContent
