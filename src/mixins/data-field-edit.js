
const UNDEFINED = '__vue_devtool_undefined__'
const INFINITY = '__vue_devtool_infinity__'
const NEGATIVE_INFINITY = '__vue_devtool_negative_infinity__'
const NAN = '__vue_devtool_nan__'

const SPECIAL_TOKENS = {
  true: true,
  false: false,
  undefined: UNDEFINED,
  null: null,
  '-Infinity': NEGATIVE_INFINITY,
  Infinity: INFINITY,
  NaN: NAN
}
function decode (list, reviver) {
  let i = list.length
  let j, k, data, key, value, proto
  while (i--) {
    data = list[i]
    proto = Object.prototype.toString.call(data)
    if (proto === '[object Object]') {
      const keys = Object.keys(data)
      for (j = 0, k = keys.length; j < k; j++) {
        key = keys[j]
        value = list[data[key]]
        if (reviver) value = reviver.call(data, key, value)
        data[key] = value
      }
    } else if (proto === '[object Array]') {
      for (j = 0, k = data.length; j < k; j++) {
        value = list[data[j]]
        if (reviver) value = reviver.call(data, j, value)
        data[j] = value
      }
    }
  }
}
function parseCircularAutoChunks (data, reviver = null) {
  if (Array.isArray(data)) {
    data = data.join('')
  }
  const hasCircular = /^\s/.test(data)
  if (!hasCircular) {
    return arguments.length === 1
      ? JSON.parse(data)
      : JSON.parse(data, reviver)
  } else {
    const list = JSON.parse(data)
    decode(list, reviver)
    return list[0]
  }
}
function parse (data, revive = false) {
  return revive
    ? parseCircularAutoChunks(data, reviver)
    : parseCircularAutoChunks(data)
}

function reviver (key, val) {
  return revive(val)
}

const specialTypeRE = /^\[native (\w+) (.*?)(<>((.|\s)*))?\]$/
const symbolRE = /^\[native Symbol Symbol\((.*)\)\]$/

export function revive (val) {
  if (val === UNDEFINED) {
    return undefined
  } else if (val === INFINITY) {
    return Infinity
  } else if (val === NEGATIVE_INFINITY) {
    return -Infinity
  } else if (val === NAN) {
    return NaN
  } else if (symbolRE.test(val)) {
    const [, string] = symbolRE.exec(val)
    return Symbol.for(string)
  } else if (specialTypeRE.test(val)) {
    const [, type, string,, details] = specialTypeRE.exec(val)
    const result = new window[type](string)
    if (type === 'Error' && details) {
      result.stack = details
    }
    return result
  } else {
    return val
  }
}


let currentEditedField = null

function numberQuickEditMod (event) {
  let mod = 1
  if (event.ctrlKey || event.metaKey) {
    mod *= 5
  }
  if (event.shiftKey) {
    mod *= 10
  }
  if (event.altKey) {
    mod *= 100
  }
  return mod
}

export default {
  inject: {
    InspectorInjection: {
      default: null
    }
  },

  props: {
    editable: {
      type: Boolean,
      default: true
    },
    removable: {
      type: Boolean,
      default: false
    },
    renamable: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      editing: false,
      editedValue: null,
      editedKey: null,
      addingValue: false,
      newField: null
    }
  },

  computed: {
    cssClass () {
      return {
        editing: this.editing
      }
    },

    isEditable () {
      // if (this.InspectorInjection && !this.InspectorInjection.editable) return false
      return this.editable &&
        !this.fieldOptions.abstract &&
        !this.fieldOptions.readOnly &&
        (
          typeof this.field.key !== 'string' ||
          this.field.key.charAt(0) !== '$'
        )
    },

    isValueEditable () {
      const type = this.valueType
      return this.isEditable &&
        (
          type === 'null' ||
          type === 'literal' ||
          type === 'string' ||
          type === 'array' ||
          type === 'plain-object'
        )
    },

    isSubfieldsEditable () {
      return this.isEditable && (this.valueType === 'array' || this.valueType === 'plain-object')
    },

    valueValid () {
      try {
        parse(this.transformSpecialTokens(this.editedValue, false))
        return true
      } catch (e) {
        return false
      }
    },

    duplicateKey () {
      return this.parentField && this.parentField.value.hasOwnProperty(this.editedKey)
    },

    keyValid () {
      return this.editedKey && (this.editedKey === this.field.key || !this.duplicateKey)
    },

    editValid () {
      return this.valueValid && (!this.renamable || this.keyValid)
    },

    quickEdits () {
      if (this.isValueEditable) {
        const value = this.field.value
        const type = typeof value
        if (type === 'boolean') {
          return [
            {
              icon: value ? 'check_box' : 'check_box_outline_blank',
              newValue: !value
            }
          ]
        } else if (type === 'number') {
          return [
            {
              icon: 'remove',
              class: 'big',
              title: this.quickEditNumberTooltip('-'),
              newValue: event => value - numberQuickEditMod(event)
            },
            {
              icon: 'add',
              class: 'big',
              title: this.quickEditNumberTooltip('+'),
              newValue: event => value + numberQuickEditMod(event)
            }
          ]
        }
      }
      return null
    }
  },

  methods: {
    openEdit (focusKey = false) {
      if (this.isValueEditable) {
        if (currentEditedField && currentEditedField !== this) {
          currentEditedField.cancelEdit()
        }
        this.editedValue = this.transformSpecialTokens(JSON.stringify(this.field.value), true)
        console.log('openEdit', this.editedValue)
        this.editedKey = this.field.key
        this.editing = true
        currentEditedField = this
        this.$nextTick(() => {
          const el = this.$refs[focusKey && this.renamable ? 'keyInput' : 'editInput']
          el.focus()
          el.setSelectionRange(0, el.value.length)
        })
      }
    },

    cancelEdit () {
      this.editing = false
      this.$emit('cancel-edit')
      currentEditedField = null
    },

    submitEdit () {
      if (this.editValid) {
        this.editing = false
        const value = this.transformSpecialTokens(this.editedValue, false)
        const newKey = this.editedKey !== this.field.key ? this.editedKey : undefined
        this.sendEdit({
          value: value != null ? parse(value, true) : value,
          newKey
        })
        this.$emit('submit-edit')
      }
    },

    sendEdit (payload) {
      this.$emit('edit-state', this.path, payload)
    },

    transformSpecialTokens (str, display) {
      Object.keys(SPECIAL_TOKENS).forEach(key => {
        const value = JSON.stringify(SPECIAL_TOKENS[key])
        let search
        let replace
        if (display) {
          search = value
          replace = key
        } else {
          search = key
          replace = value
        }
        str = str.replace(new RegExp(search, 'g'), replace)
      })
      return str
    },

    quickEdit (info, event) {
      let newValue
      if (typeof info.newValue === 'function') {
        newValue = info.newValue(event)
      } else {
        newValue = info.newValue
      }
      this.sendEdit({ value: JSON.stringify(newValue) })
    },

    removeField () {
      this.sendEdit({ remove: true })
    },

    addNewValue () {
      let key
      if (this.valueType === 'array') {
        key = this.field.value.length
      } else if (this.valueType === 'plain-object') {
        let i = 1
        while (this.field.value.hasOwnProperty(key = `prop${i}`)) i++
      }
      this.newField = { key, value: UNDEFINED }
      this.expanded = true
      this.addingValue = true
      this.$nextTick(() => {
        this.$refs.newField.openEdit(true)
      })
    },

    containsEdition () {
      return currentEditedField && currentEditedField.path.indexOf(this.path) === 0
    },

    cancelCurrentEdition () {
      this.containsEdition() && currentEditedField.cancelEdit()
    },

    quickEditNumberTooltip (operator) {
      return this.$t('DataField.quickEdit.number.tooltip', {
        operator
      })
    }
  }
}
