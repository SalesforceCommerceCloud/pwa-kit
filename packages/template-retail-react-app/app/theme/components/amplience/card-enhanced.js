export default {
    baseStyle: (props) => ({
        image: {
            width: '100%',
            filter: 'grayscale(0%)',
            transition: 'all 0.8s ease'
        },
        tile: {
            position: 'relative',
            margin: 0,
            display: 'block'
        },
        tileText: {
            position: 'absolute',
            display: 'table',
            top: 0,
            left: 0,
            padding: '9px',
            width: '100%',
            height: '100%',
            transition: 'all 0.8s ease',
            textAlign: `${props.tAlign}`
        },
        textCell: {
            display: 'table-cell',
            color: `${props.color}`,
            verticalAlign: `${props.vAlign}`,
            mixBlendMode: `${props.blend}`
        },
        textHoverCell: {
            display: 'table-cell',
            color: `${props.color}`,
            verticalAlign: `${props.vAlign}`
        },
        textPane: {
            borderRadius: '4px',
            display: 'inline-block',
            padding: '6px 10px',
            width: '70%',
            transition: 'all 0.8s ease',
            background: 'rgba(255, 255, 255, 0.5)'
        },
        h: {
            fontSize: '22px'
        },
        p: {
            textTransform: 'capitalize',
            fontSize: '17px'
        },
        linkText: {
            textTransform: 'uppercase',
            fontSize: '13px',
            fontWeight: 'bold'
        }
    }),
    parts: [
        'image',
        'tile',
        'tileText',
        'textCell',
        'textHoverCell',
        'textPane',
        'h',
        'p',
        'linkText'
    ]
}
