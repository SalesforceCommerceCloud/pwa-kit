
export const processRequest = ({
    path,
    querystring
}) => {
    console.log("I processed a request")
    return {
        path,
        querystring
    }
}
