<template>
  <el-dialog
    title="正在录制"
    :visible.sync="valueModel"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false">
    <div style="font-size: 18px;margin: 10px 0;text-align: center;">已录制 {{currentCaseDetail.eventList.length}} 个操作</div>
    <span slot="footer" class="dialog-footer">
        <el-button round type="danger" @click="endLuzhi">结束录制</el-button>
      </span>
  </el-dialog>
</template>
<style>

</style>
<script>
  import {mapGetters} from 'vuex'
  export default {
    components: {},
    value: {
      type: Boolean,
      default: false
    },
    data() {
      return {}
    },
    computed: {
      ...mapGetters(['backgroundPageConnection', 'caseList', 'current', 'disconnect']),
      valueModel: {
        get: function () {
          return this.value
        },
        set: function (val) {
          this.$emit('input', val)
        }
      },
      currentCaseDetail () {
        if (this.caseList[this.current]) {
          return this.caseList[this.current]
        } else {
          return {eventList: []}
        }
      }
    },
    created() {

    },
    mounted() {

    },
    methods: {
      endLuzhi () {
        // 发送页面监听消息
        this.backgroundPageConnection.postMessage({
          type: 'unbind',
          tabId: chrome.devtools.inspectedWindow.tabId,
        });
        this.valueModel = false
      }
    }
  }
</script>
