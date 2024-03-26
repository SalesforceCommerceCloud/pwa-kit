// Note: the base extension should not need to do this. Also this "_" extension resolver is context aware. E.g.
// if I'm using it in an extension that is the 2nd in the array, it will import from the first occurance of the 
// file before it.
import handlers from '*/app/handlers'

// // Note: Maybe handlers is also a function that returns an array so we can have access to the runtime and app.
// // Then we can dedup the handlers based on the path.
// export const handlers = [{
//     mothod: 'GET',
//     path: '/test',
//     handler: (req, res) => {
//         res.send("Hello")
//     }
// }]

export const handlers = ({runtime, app}: any) => {
    // Apply the handlers from the extension previous.
    handlers({runtime, app})

    return [{
        mothod: 'GET',
        path: '/test',
        handler: runtime.serveStaticFile('static/favicon.ico')
    }]
}