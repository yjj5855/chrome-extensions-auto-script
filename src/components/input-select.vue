<template>
  <el-select v-model="valueModel" @change="handleChange" :placeholder="editStatus?placeholder:''" :disabled="!editStatus" :multiple="multiple" :clearable="clearable" :filterable="filterable" :allow-create="allowCreate">
    <el-option
      v-for="item in options"
      :key="item.code"
      :label="trimLabel ? item.name.trim() : item.name"
      :value="item.code">
      <span>{{item.name}}</span>
    </el-option>
  </el-select>
</template>
<style>

</style>
<script>
  export default {
    components: {},
    props: {
      value: {
        type: [String, Number, Array],
        default: ''
      },
      editStatus: {
        type: Boolean,
        default: false
      },
      options: {
        type: Array,
        default: function () {
          return []
        }
      },
      trimLabel: {
        type: Boolean,
        default: false
      },
      multiple: {
        type: Boolean,
        default: false
      },
      clearable: {
        type: Boolean,
        default: true
      },
      filterable: {
        type: Boolean,
        default: false
      },
      placeholder: {
        type: String,
        default: '请选择'
      },
      allowCreate: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return {}
    },
    computed: {
      valueModel: {
        get: function () {
          return this.value
        },
        set: function (val) {
          this.$emit('input', val)
        }
      }
    },
    created () {
    },
    mounted () {
    },
    methods: {
      handleChange (value) {
        this.$emit('change', value)
      }
    }
  }
</script>
