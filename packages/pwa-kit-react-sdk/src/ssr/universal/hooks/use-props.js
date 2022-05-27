import {useState, useContext, useEffect} from 'react'
import {useLocation, useParams} from 'react-router-dom'

import Context from '../get-props-context'
import {useUID} from 'react-uid'
import {useExpress} from './index'

const isClient = typeof window !== 'undefined'

// TODO: Add `source` argument to allow for fine grained control of when
// the hook is run.
const useProps = (initial, effect) => {
    // Function overloading.
    if (typeof initial === 'function') {
        effect = initial
        initial = {}
    }

    const key = useUID()
    const location = useLocation()
    const params = useParams()
    const {req, res} = useExpress()
    const context = useContext(Context)
    const [data, setData] = useState(context[key] || initial)
    const [ignoreFirst, setIgnoreFirst] = useState(true)

    // TODO: It would be nice to handle:
    // 1. Effects that are not promises
    // 2. Delay invokation of the function/promise so we can pass in extra args in the
    // rendering pipeline.
    // 3. Make this asyn/await style.
    if (context.requests) {
        context.requests.push(
            Promise.resolve().then(() => {
                return effect({req, res, location, params})
            }).then((data) => {
                if (data) {
                    context[key] = data
                    return {
                        [key]: data
                    }
                }
            })
        )
    }

    if (isClient) {
        // Note: This is only executed on the client.
        // TODO: We need to allow the user to control the second paramater of this
        // effect, also setting it's default value.
        // TODO: Effect should be passed the extra args defined in the AppConfig.
        useEffect(() => {
            if (ignoreFirst) {
                setIgnoreFirst(false)
                return
            }

            console.log('Runing effect on client...')
            Promise.resolve().then(() => {
                return effect({location, params})
            }).then((data) => {
                setData(data)
            })
        }, [location])
    }

    return data
}

export default useProps