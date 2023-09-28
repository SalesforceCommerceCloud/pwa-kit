export default {
    baseStyle: {
        ctaContainer: {
            display: 'flex',
            width: '0px',
            height: '0px',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'opacity 0.2s'
        },
        ctaButton: {
            minWidth: 'unset',
            border: '2px solid white',
            backgroundColor: 'rgba(1, 118, 211, 0.75)',
            boxShadow: '2px 4px 8px rgb(0 0 0 / 20%)'
        },
        arrowContainer: {
            height: '20px',
            margin: '-10px 0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            transformOrigin: 'center left'
        },
        arrowBody: {
            position: 'absolute',
            marginRight: '8px',
            height: '8px',
            backgroundSize: '10px 8px',
            backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,1) 36%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 64%)'
        },
        arrowHead: {
            transform: 'rotate(45deg)',
            backgroundColor: 'white',
            backgroundClip: 'padding-box',
            width: '16px',
            height: '16px',
            margin: '-8px',
            borderRadius: '8px',
            border: '2px solid rgba(0, 0, 0, 0.3)'
        },
        arrowHeadContainer: {
            transition: 'transform 0.3s',
            width: '48px',
            height: '48px',
            margin: '-24px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
        }
    },
    parts: [
        'ctaContainer',
        'ctaButton',
        'arrowContainer',
        'arrowBody',
        'arrowHead',
        'arrowHeadContainer'
    ]
}
