import {createServerEffectContext} from '../server-effect-factory'

export const DEFAULT_CONTEXT_KEY = '__SERVER_EFFECTS__'

// TODO: Change name of "resovleData"
const {ServerEffectProvider, useServerEffect, resolveData} = createServerEffectContext(DEFAULT_CONTEXT_KEY)

export default useServerEffect

export {
    ServerEffectProvider,
    resolveData
}