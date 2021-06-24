<template>
  <div
    class="event-item"
    @mouseover="highlight()"
    @mouseleave="unhighlight()">
    <div v-if="item.type == 'click'">
      点击 {{item.tagName}}
    </div>
    <div v-else-if="item.type == 'scroll'">
      滚动 深度({{item.scrollList.length}})
    </div>
    <div v-else-if="item.type == 'set-input-value'">
      输入 {{item.value}}
    </div>
    <div v-else-if="item.type == 'set-select-value'">
      选择 {{item.value}}
    </div>
    <div v-else>暂不识别</div>
  </div>
</template>
<style scoped>
  .event-item {
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 8px;
    padding-right: 8px;
  }
  .event-item:hover {
    background-color: rgba(65, 184, 131, 0.35);
  }
</style>
<script>
  import editDiv from '../components/edit-div'
  import {mapGetters} from 'vuex'
  export default {
    components: {
      editDiv
    },
    props: {
      item: {
        type: Object,
        required: true
      },
      itemIndex: {
        type: Number,
        required: true
      },
      list: {
        type: Array,
        default () {
          return []
        }
      }
    },
    data () {
      return {}
    },
    computed: {
      ...mapGetters(['backgroundPageConnection']),
    },
    created () {

    },
    mounted() {

    },
    methods: {
      highlight () {
        // 获取到需要高亮的xy坐标
        let xy = {x:0, y:0, content: ''}
        if (this.item.type === 'click') {
          xy.x = this.item.x
          xy.y = this.item.y
          xy.clientX = this.item.clientX
          xy.clientY = this.item.clientY
          xy.content = '点击'
        } else if (this.item.type === 'scroll') {
          xy.x = this.item.mouseX
          xy.y = this.item.mouseY
          xy.clientX = this.item.clientX
          xy.clientY = this.item.clientY
          xy.content = '滚动'
        } else if (this.item.type === 'set-input-value') {
          // 向上查第一个click事件的xy坐标
          for (let i = this.itemIndex - 1; i >= 0; i--) {
            if (this.list[i].type === 'click' && (this.list[i].tagName === 'INPUT' || this.list[i].tagName === 'TEXTAREA')) {
              xy.x = this.list[i].x
              xy.y = this.list[i].y
              xy.clientX = this.list[i].clientX
              xy.clientY = this.list[i].clientY
              break
            }
          }
          xy.content = '输入'
        } else if (this.item.type === 'set-select-value') {
          // 向上查第一个click事件的xy坐标
          for (let i = this.itemIndex - 1; i >= 0; i--) {
            if (this.list[i].type === 'click' && (this.list[i].tagName === 'SELECT')) {
              xy.x = this.list[i].x
              xy.y = this.list[i].y
              xy.clientX = this.list[i].clientX
              xy.clientY = this.list[i].clientY
              break
            }
          }
          xy.content = '选择'
        } else {
          return
        }
        this.backgroundPageConnection.postMessage({
          type: 'dom-highlight',
          tabId: chrome.devtools.inspectedWindow.tabId,
          highlightData: xy
        })
      },
      unhighlight () {
        this.backgroundPageConnection.postMessage({
          type: 'dom-unhighlight',
          tabId: chrome.devtools.inspectedWindow.tabId
        })
      }
    }
  }
</script>
