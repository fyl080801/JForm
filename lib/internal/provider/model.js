import { get, isEmpty, isArray } from 'lodash-es'

const attrsValueElements = ['input', 'option', 'textarea']
const domPropsValueElements = ['input', 'textarea', 'select']
const domPropsCheckedElements = ['checkbox', 'radio']
const innerHTMLElements = ['textarea']
// const requiredElements = ["input", "select", "textarea"];

const converter = {
  number: value => +value,
  string: value => value + '',
  boolean: value => !!value,
  date: value => new Date(value)
}

const defaultHandler = field => {
  const { component, fieldOptions } = field

  if (
    domPropsValueElements.indexOf(component) >= 0 &&
    domPropsCheckedElements.indexOf(fieldOptions.domProps.type) >= 0
  ) {
    return value => {
      return value.target.checked
    }
  }

  if (domPropsValueElements.indexOf(component) >= 0) {
    return value => {
      return value.target.value
    }
  }

  return value => {
    return value
  }
}

const initFieldOptions = (component, fieldOptions, currentValue) => {
  const { domProps = {}, attrs = {}, props = {} } = fieldOptions

  if (domPropsValueElements.indexOf(component) >= 0) {
    domProps.value = currentValue
  }

  if (domPropsCheckedElements.indexOf(domProps.type) >= 0) {
    domProps.checked = currentValue
  }

  if (innerHTMLElements.indexOf(component) >= 0) {
    domProps.innerHtml = currentValue
  }

  if (attrsValueElements.indexOf(component) >= 0) {
    attrs.value = currentValue
  }

  props.value = currentValue
}

export default (field, options) => {
  const { model } = field
  const { registry } = options

  const provider = (field, context) => {
    const { component, fieldOptions } = field
    const modelDefine = isArray(field.model) ? field.model : [field.model]
    const propertyName = modelDefine[0]
    const onDefine = modelDefine[1] || {}
    const {
      on = 'input',
      nativeOn,
      handler = defaultHandler(field),
      type
    } = onDefine

    initFieldOptions(component, fieldOptions, get(context.model, propertyName))

    const tirgger = isEmpty(nativeOn) ? 'on' : 'nativeOn'

    fieldOptions[tirgger] = fieldOptions[tirgger] || {}

    if (typeof fieldOptions[tirgger][nativeOn || on] !== 'function') {
      Object.assign(fieldOptions[tirgger], {
        [nativeOn || on]: value => {
          const result = handler(value)
          const convert = converter[type]
          registry.emitter.emit('update', {
            path: propertyName,
            value: convert ? convert(result) : result
          })
        }
      })
    }
  }

  return (model &&
    isArray(model) &&
    model.length >= 1 &&
    typeof model[0] === 'string') ||
    typeof model === 'string'
    ? provider
    : null
}
