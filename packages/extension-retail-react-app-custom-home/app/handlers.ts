// Note: the base extension should not need to do this. Also this "_" extension resolver is context aware. E.g.
// if I'm using it in an extension that is the 2nd in the array, it will import from the first occurance of the 
// file before it.
// import handlers from '*/app/handlers'

export default ({app, runtime}: any) => {
    // Apply the handlers from the extension previous.
    // handlers({app, runtime})

    app.get('/store-finder-api/get-location', (_req: any, res: any) => {
        res.send('41 24.2028, 2 10.4418')
    })
}