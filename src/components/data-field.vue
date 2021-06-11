<template>
  <div class="data-field">
    <div
      :style="{ marginLeft: depth * 14 + 'px' }"
      :class="{'force-toolbar z-10': contextMenuOpen || editing,}"
      class="self"
      @click="onClick"
    >
      <i
        v-show="isExpandableType"
        :class="[expanded? 'el-icon-caret-bottom': 'el-icon-caret-right']"
      ></i>
      <span
        :class="{ abstract: fieldOptions.abstract }"
        class="key"
      >{{ displayedKey }}</span>
      <span
        v-if="!fieldOptions.abstract"
        class="colon"
      >:</span>
      <span v-if="editing" class="edit-overlay">
        <input
          ref="editInput"
          v-model="editedValue"
          class="edit-input value-input text-black"
          :class="{ error: !valueValid }"
          list="special-tokens"
          @keydown.esc.capture.stop.prevent="cancelEdit()"
          @keydown.enter="submitEdit()"
        >
      </span>
      <span
        v-else
        :class="valueClass"
        class="value"
        @dblclick="openEdit()"
        v-html="formattedValue"
      />
    </div>

    <div
      v-if="expanded && isExpandableType"
      class="children"
    >
      <DataField
        v-for="subField in formattedSubFields"
        :key="subField.key"
        :field="subField"
        :parent-field="field"
        :depth="depth + 1"
        :path="`${path}.${subField.key}`"
        :editable="isEditable"
        :removable="isSubfieldsEditable"
        :renamable="editable && valueType === 'plain-object'"
        :force-collapse="forceCollapse"
        :is-state-field="isStateField"
        @edit-state="(path, payload) => $emit('edit-state', path, payload)"
      />
      <i
        v-if="subFieldCount > limit"
        :style="{ marginLeft: depthMargin + 'px' }"
        class="el-icon-more"
        @click="showMoreSubfields()"
      ></i>
    </div>
  </div>
</template>

<script>
  import DataFieldEdit from '../mixins/data-field-edit'
  import {isPlainObject, valueType, formattedValue, sortByKey} from '../assets/value'

  function subFieldCount (value) {
    if (Array.isArray(value)) {
      return value.length
    } else if (value && typeof value === 'object') {
      return Object.keys(value).length
    } else {
      return 0
    }
  }
  export default {
    name: 'DataField',
    mixins: [
      DataFieldEdit
    ],

    props: {
      field: {
        type: Object,
        required: true
      },
      depth: {
        type: Number,
        required: true
      },
      path: {
        type: String,
        required: true
      },
      forceCollapse: {
        type: String,
        default: null
      },
      isStateField: {
        type: Boolean,
        default: false
      }
    },

    data () {
      const value = this.field.value && this.field.value._custom ? this.field.value._custom.value : this.field.value
      return {
        contextMenuOpen: false,
        limit: 20,
        expanded: this.depth === 0 && this.field.key !== '$route' && (subFieldCount(value) < 12)
      }
    },


    computed: {
      depthMargin () {
        return (this.depth + 1) * 14 + 10
      },
      valueType () {
        return valueType(this.field.value)
      },
      // valueDetails () {
      //   return valueDetails(this.field.value)
      // },
      rawValueType () {
        return typeof this.field.value
      },
      isExpandableType () {
        let value = this.field.value
        if (this.valueType === 'custom') {
          value = value._custom.value
        }
        const closed = this.fieldOptions.closed
        const closedDefined = typeof closed !== 'undefined'
        return (!closedDefined &&
          (
            Array.isArray(value) ||
            isPlainObject(value)
          )) ||
          (
            closedDefined &&
            !closed
          )
      },
      formattedValue () {
        const value = this.field.value
        if (this.field.objectType === 'Reactive') {
          return 'Reactive'
        } else if (this.fieldOptions.abstract) {
          return ''
        } else {
          let result = formattedValue(value)
          if (this.field.objectType) {
            result += ` <span class="text-gray-500">(${this.field.objectType})</span>`
          }
          return result
        }
      },
      rawValue () {
        let value = this.field.value
        // CustomValue API
        const isCustom = this.valueType === 'custom'
        let inherit = {}
        if (isCustom) {
          inherit = value._custom.fields || {}
          value = value._custom.value
        }
        if (value && value._isArray) {
          value = value.items
        }
        return { value, inherit }
      },
      formattedSubFields () {
        let { value, inherit } = this.rawValue
        if (Array.isArray(value)) {
          return value.slice(0, this.limit).map((item, i) => ({
            key: i,
            value: item,
            ...inherit
          }))
        } else if (typeof value === 'object') {
          value = Object.keys(value).map(key => ({
            key,
            value: value[key],
            ...inherit
          }))
          if (this.valueType !== 'custom') {
            value = sortByKey(value)
          }
        }
        return value.slice(0, this.limit)
      },
      subFieldCount () {
        const { value } = this.rawValue
        return subFieldCount(value)
      },
      valueTooltip () {
        const type = this.valueType
        if (this.field.raw) {
          return `<span class="font-mono">${this.field.raw}</span>`
        } else if (type === 'custom') {
          return this.field.value._custom.tooltip
        } else if (type.indexOf('native ') === 0) {
          return type.substr('native '.length)
        } else {
          return null
        }
      },
      fieldOptions () {
        if (this.valueType === 'custom') {
          return Object.assign({}, this.field, this.field.value._custom)
        } else {
          return this.field
        }
      },
      editErrorMessage () {
        if (!this.valueValid) {
          return 'Invalid value (must be valid JSON)'
        } else if (!this.keyValid) {
          if (this.duplicateKey) {
            return 'Duplicate key'
          } else {
            return 'Invalid key'
          }
        }
        return ''
      },
      valueClass () {
        const cssClass = [this.valueType, `raw-${this.rawValueType}`]
        if (this.valueType === 'custom') {
          const value = this.field.value
          value._custom.type && cssClass.push(`type-${value._custom.type}`)
          value._custom.class && cssClass.push(value._custom.class)
        }
        return cssClass
      },
      displayedKey () {
        let key = this.field.key
        if (typeof key === 'string') {
          key = key.replace('__vue__', '')
        }
        return key
      }
    },
    watch: {
      forceCollapse: {
        handler (value) {
          if (value === 'expand' && this.depth < 4) {
            this.expanded = true
          } else if (value === 'collapse') {
            this.expanded = false
          }
        },
        immediate: true
      }
    },
    methods: {
      onClick (event) {
        // Cancel if target is interactive
        if (event.target.tagName === 'INPUT' || event.target.className.includes('button')) {
          return
        }
        // CustomValue API `file`
        if (this.valueType === 'custom' && this.fieldOptions.file) {
          return openInEditor(this.fieldOptions.file)
        }
        if (this.valueType === 'custom' && this.fieldOptions.type === '$refs') {
          window.alert('DOM inspection is not supported in this shell.')
        }
        // Default action
        this.toggle()
      },
      toggle () {
        if (this.isExpandableType) {
          this.expanded = !this.expanded
          //
          !this.expanded && this.cancelCurrentEdition()
        }
      },
      showMoreSubfields () {
        this.limit += 20
      }
    }
  }
</script>

<style scoped>
  .data-field {
    user-select: text;
    font-size: 12px;
    cursor: pointer;
  }

  .self {
    height: 20px;
    line-height: 20px;
    position: relative;
    white-space: nowrap;
    padding-left: 14px;
  }

  .self .edit-overlay {
    display: inline-flex;
    align-items: center;
  }


  .key {
    color: #881391;
  }
  .vue-ui-dark-mode .key {
    color: lightPink;
  }
  .key.abstract {
    color: #b1cdf1;
  }

  .value {
    display: inline-block;
    color: #444;
  }
  .value.string,
  .value.native {
    color: red;
  }
  .value.string >>> span {
    color: black;
  }
  .vue-ui-dark-mode .value.string >>> span {
    color: red;
  }
  .value.null {
    color: #999;
  }
  .value.literal {
    color: rgba(68, 68, 68, 0.91);
  }
  .value.raw-boolean {
    width: 36px;
  }
  .value.native.Error {
    background: red;
    color: white !important;
    padding: 0 4px;
  }
  .value.native.Error::before {
    content: 'Error: ';
    opacity: 0.75;
  }



  .meta {
    font-size: 12px;
    font-family: Menlo, Consolas, monospace;
    min-width: 150px;
  }
  .meta .key {
    display: inline-block;
    width: 80px;
    color: #e785ef;
  }
  .vue-ui-dark-mode .meta .key {
    color: #881391;
  }
  .meta .value {
    color: #fff;
  }
  .vue-ui-dark-mode .meta .value {
    color: #000;
  }
  .meta-field:not(:last-child) {
    margin-bottom: 4px;
  }

  .edit-input {
    font-family: Menlo, Consolas, monospace;
    border: solid 1px green;
    border-radius: 3px;
    padding: 2px;
    outline: none;
  }
  .edit-input.error {
    border-color: orange;
  }
  .value-input {
    width: 180px;
  }
  .key-input {
    width: 90px;
    color: #881391;
  }
</style>
