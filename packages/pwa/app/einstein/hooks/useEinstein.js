import EinsteinAPI from '..'
import {useCommerceAPI} from '../../commerce-api/utils'
import {einsteinAPIConfig} from '../../einstein-api.config'

const useEinstein = () => {
    const api = useCommerceAPI()
    const usid = api.auth.usid
    const einsteinApi = new EinsteinAPI(einsteinAPIConfig, usid)
    return einsteinApi
}

export default useEinstein
