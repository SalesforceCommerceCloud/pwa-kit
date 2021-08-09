/**
 * Make a custom PropType validator, with the usual "MyProp()" and
 * "MyProp.isRequired()" behavior.
 *
 * @param isValid {Function}
 * @param errMsg {String}
 * @private
 */
export const makeValidator = (isValid, errMsg) => {
    const propTypeValidator = (required) => (props, propName, componentName) => {
        const invalid = () =>
            Error(`Invalid prop ${propName} supplied to ${componentName}. ${errMsg}`)
        const val = props[propName]
        if (val === null || val === undefined) {
            return required ? invalid() : null
        } else {
            return !isValid(val) ? invalid() : null
        }
    }
    const validator = propTypeValidator(false)
    validator.isRequired = propTypeValidator(true)
    return validator
}
