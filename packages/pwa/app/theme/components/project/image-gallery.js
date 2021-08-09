/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
export default {
    baseStyle: {
        container: {},
        heroImage: {},
        heroImageGroup: {
            marginBottom: 2
        },
        heroImageSkeleton: {
            marginBottom: 2
        },
        thumbnailImageGroup: {},
        thumbnailImageItem: {
            flexShrink: 0,
            cursor: 'pointer',
            flexBasis: [20, 20, 24],
            borderStyle: 'solid',
            marginBottom: [1, 1, 2, 2],
            marginRight: [1, 1, 2, 2],
            _focus: {
                boxShadow: 'outline'
            },
            _focusVisible: {
                outline: 0
            }
        },
        thumbnailImageSkeleton: {
            marginRight: 2,
            width: [20, 20, 24, 24]
        }
    },
    sizes: {
        sm: {
            heroImageSkeleton: {
                maxWidth: ['none', 'none', '500px']
            },
            heroImage: {
                maxWidth: ['none', 'none', '500px']
            }
        },
        md: {
            heroImageSkeleton: {
                maxWidth: ['none', 'none', '680px']
            },
            heroImage: {
                maxWidth: ['none', 'none', '680px']
            }
        }
    },
    defaultProps: {
        size: 'md'
    },
    parts: ['container', 'heroImageGroup', 'heroImage', 'heroImageSkeleton', 'thumbnailImageGroup']
}
