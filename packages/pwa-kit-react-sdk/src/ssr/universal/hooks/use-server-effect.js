import {useState, useContext, useEffect} from 'react'
import {useLocation, useParams} from 'react-router-dom'

const isClient = typeof window !== 'undefined'

/**
 * Create a provider for use with hooks created with the paired createSeverEffect function.
 *
 * @param {string} path - relative path from the build directory to the asset
 * @function
 * 
 * @returns {ServerEffectProvider}
 */
export const createServerEffectContext = (name, extraArgs) => {
    return () => {
        React.createContext()
    }
}

/**
 * 
 * @param {*} initial 
 * @param {*} effect 
 * @returns 
 */
export const useServerEffect = (initial, effect) => {
    // Function overloading.
    if (typeof initial === 'function') {
        effect = initial
        initial = {}
    }

    const key = `uh_${useUID()}` // uh - use hook .. lol
    const location = useLocation()
    const params = useParams()
    const {req, res} = useExpress()
    const context = useContext(Context)
    const [data, setData] = useState(context[key] || initial)
    const [ignoreFirst, setIgnoreFirst] = useState(true)

    if (context.requests) {
        // NOTE: Here I created an object type that has the effect/action and a function to
        // set the action in motion and place the return value in our state. I did this because
        // if we used the solution above the effects are immediately invocked, and because we 
        // render twice, we would end up making those calls to APIs 2 times.
        context.requests.push({
            effect: effect.bind(this, {req, res, location, params}),
            fireEffect: function () {
                return Promise.resolve()
                    .then(this.effect)
                    .then((data) => {
                        if (data) {
                            context[key] = data
                            return {
                                [key]: data
                            }
                        } else {
                            throw new Error('`useProps` must return a value.')
                        }
                    })  
            }
        })
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

/**
 * 
 */
export const createSeverEffect = (effect) => {
    return useServerEffect.bind(this, effect)
}