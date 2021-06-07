<template>
  <div>
    <el-button round @click="$router.back()">返回</el-button>
    <el-button round type="primary" @click="startLuzhi">开始录制</el-button>
    <el-button round type="success" @click="runCase">执行</el-button>
    <el-button round type="success" @click="oneByObeRunCase">一条条执行</el-button>

    <div
      v-for="(item,index) in caseDetail.eventList"
      :key="index"
      style="margin-bottom: 10px;"
      :style="{background: currentEventIndex === index ? '#ff0000' : '#fff'}"
    >
<!--      {{item.type}} 后延迟 {{item.time}} 毫秒-->
      <span v-for="(val, key) in item">
        <span>{{key}}:</span>
        <span v-if="typeof val === 'object'">object</span>
        <span v-else>{{val}}</span>;&emsp;
      </span>
    </div>

    <el-dialog
      title="正在录制"
      :visible.sync="luzhiDialogStatus"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false">
      <div style="font-size: 18px;margin: 10px 0;text-align: center;">已录制 {{caseDetail.eventList.length}} 个操作</div>
      <span slot="footer" class="dialog-footer">
        <el-button round type="danger" @click="endLuzhi">结束录制</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import editDiv from '../components/edit-div'
import endDialog from '../components/end-diaolog'
import {mapGetters} from 'vuex'
export default {
  components: {
    endDialog,
    'edit-div': editDiv
  },
  data () {
    return {
      luzhiDialogStatus: false,
      currentEventIndex: -1
    }
  },
  computed: {
    ...mapGetters(['backgroundPageConnection', 'caseList', 'current', 'disconnect']),
    index () {
      return this.$route.params.index
    },
    caseDetail () {
      return this.caseList[this.index]
    }
  },
  created () {

  },
  mounted () {
  },
  methods: {
    startLuzhi () {
      this.$store.commit('setCurrent', this.index)
      this.backgroundPageConnection.postMessage({
        type: 'bind',
        tabId: chrome.devtools.inspectedWindow.tabId
      })
      this.luzhiDialogStatus = true
    },
    endLuzhi () {
      // 发送页面监听消息
      this.backgroundPageConnection.postMessage({
        type: 'unbind',
        tabId: chrome.devtools.inspectedWindow.tabId,
      });
      this.luzhiDialogStatus = false
    },
    runCase () {
      // 连接bg
      this.$store.commit('connect')
      this.backgroundPageConnection.postMessage({
        type: 'run-case',
        tabId: chrome.devtools.inspectedWindow.tabId,
        case: JSON.parse(JSON.stringify(this.caseDetail))
      })
    },
    async oneByObeRunCase () {
      // 连接bg
      this.$store.commit('connect')
      await this.startEventList(JSON.parse(JSON.stringify(this.caseDetail)))
    },
    async startEventList (vm) {
      for (let i = 0; i < vm.eventList.length; i++) {
        this.currentEventIndex = i
        let item = vm.eventList[i]
        this.backgroundPageConnection.postMessage({
          type: 'run-one-case',
          tabId: chrome.devtools.inspectedWindow.tabId,
          case: item,
          index: i
        })
        await this.sleep(item.time)
      }
      this.currentEventIndex = -1
    },
    sleep (time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, time)
      })
    }
  }
}
</script>

<style>
</style>
