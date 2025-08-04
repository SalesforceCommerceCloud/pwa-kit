/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export default {
    baseStyle: {
        container: {
            padding: 6,
            spacing: 0
        },
        sectionHeader: {
            fontWeight: 200,
            margin: '2 0 1 0',
            paddingLeft: 12,
            color: 'gray.500',
            fontSize: 'sm',
            lineHeight: 1.2
        },
        phraseContainer: {
            margin: '2 0 1 0',
            paddingLeft: 12
        },
        suggestionsContainer: {
            spacing: 0
        },
        suggestionsBox: {
            mx: '-16px'
            // borderBottom: '1px solid',
            // borderColor: 'gray.200'
        },
        suggestionButton: {
            width: 'full',
            fontSize: 'md',
            marginTop: 0,
            variant: 'menu-link',
            style: {
                justifyContent: 'flex-start',
                padding: '8px 12px'
            }
        },
        imageContainer: {
            width: 10,
            height: 10,
            marginRight: 4,
            borderRadius: 'full',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        },
        suggestionImage: {
            boxSize: 10,
            borderRadius: 'full',
            objectFit: 'cover',
            background: '#f3f3f3'
        },
        textContainer: {
            textAlign: 'left'
        },
        suggestionName: {
            fontWeight: '500',
            as: 'span'
        },
        brandName: {
            fontWeight: '700',
            as: 'span'
        },
        categoryParent: {
            as: 'span',
            color: 'gray.500',
            fontSize: 'sm'
        },
        badgeGroup: {
            position: 'absolute',
            top: 2,
            left: 2
        }
    }
}
