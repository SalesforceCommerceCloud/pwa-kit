export default {
    baseStyle: (props) => ({
        gridStyle: {
            display: 'grid',
            gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
            gap: `${props.gap}px`,
            direction: `${props.direction == 'reverse' ? 'rtl' : 'ltr'}`
        },
        gridItem: {
            gridColumnEnd: `span ${props.cols}`,
            gridRowEnd: `span ${props.rows}`
        }
    }),
    parts: ['gridStyle']
}
