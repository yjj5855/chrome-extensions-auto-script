const UNDEFINED = '__vue_devtool_undefined__'
const INFINITY = '__vue_devtool_infinity__'
const NEGATIVE_INFINITY = '__vue_devtool_negative_infinity__'
const NAN = '__vue_devtool_nan__'

const rawTypeRE = /^\[object (\w+)]$/
const specialTypeRE = /^\[native (\w+) (.*?)(<>((.|\s)*))?\]$/

export function isPlainObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export function specialTokenToString (value) {
  if (value === null) {
    return 'null'
  } else if (value === UNDEFINED) {
    return 'undefined'
  } else if (value === NAN) {
    return 'NaN'
  } else if (value === INFINITY) {
    return 'Infinity'
  } else if (value === NEGATIVE_INFINITY) {
    return '-Infinity'
  }
  return false
}


export function valueType (value) {
  const type = typeof value
  if (value == null || value === UNDEFINED) {
    return 'null'
  } else if (
    type === 'boolean' ||
    type === 'number' ||
    value === INFINITY ||
    value === NEGATIVE_INFINITY ||
    value === NAN
  ) {
    return 'literal'
  } else if (value && value._custom) {
    return 'custom'
  } else if (type === 'string') {
    const typeMatch = specialTypeRE.exec(value)
    if (typeMatch) {
      const [, type] = typeMatch
      return `native ${type}`
    } else {
      return 'string'
    }
  } else if (Array.isArray(value) || (value && value._isArray)) {
    return 'array'
  } else if (isPlainObject(value)) {
    return 'plain-object'
  } else {
    return 'unknown'
  }
}
const ESC = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '&': '&amp;'
}
function escapeChar (a) {
  return ESC[a] || a
}
function escape (s) {
  return s.replace(/[<>"&]/g, escapeChar)
}

export function formattedValue (value, quotes = true) {
  let result
  const type = valueType(value)
  if ((result = specialTokenToString(value))) {
    return result
  } else if (type === 'custom') {
    return value._custom.display
  } else if (type === 'array') {
    return 'Array[' + value.length + ']'
  } else if (type === 'plain-object') {
    return 'Object' + (Object.keys(value).length ? '' : ' (empty)')
  } else if (type.includes('native')) {
    return escape(specialTypeRE.exec(value)[2])
  } else if (typeof value === 'string') {
    const typeMatch = value.match(rawTypeRE)
    if (typeMatch) {
      value = escape(typeMatch[1])
    } else if (quotes) {
      value = `<span>"</span>${escape(value)}<span>"</span>`
    } else {
      value = escape(value)
    }
    value = value.replace(/ /g, '&nbsp;')
      .replace(/\n/g, '<span>\\n</span>')
  }
  return value
}

export function sortByKey (state) {
  return state && state.slice().sort((a, b) => {
    if (a.key < b.key) return -1
    if (a.key > b.key) return 1
    return 0
  })
}

export function set (object, path, value, cb = null) {
  const sections = Array.isArray(path) ? path : path.split('.')
  while (sections.length > 1) {
    object = object[sections.shift()]
  }
  const field = sections[0]
  if (cb) {
    cb(object, field, value)
  } else {
    object[field] = value
  }
}
