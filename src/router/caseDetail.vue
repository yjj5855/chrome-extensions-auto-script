<template>
  <div>
    <template v-if="$route.params.index >= 0">
      <el-button round @click="$router.back()">返回</el-button>
      <el-button round type="primary" @click="startLuzhi">开始录制</el-button>
      <el-button round type="success" @click="oneByOneRunCase">自动执行</el-button>
    </template>

    <div style="margin: 8px;font-size: 20px;">
      <div>{{caseDetail.name}}</div>
      <div style="text-align: center;padding: 8px 0;">
        <el-button round type="primary" :disabled="currentEventIndex <= 0" @click="postRunMessage(currentEventIndex - 1)">上一步</el-button>
        <el-button round type="primary" :disabled="currentEventIndex === caseDetail.eventList.length" @click="postRunMessage(currentEventIndex + 1)">下一步</el-button>
      </div>
    </div>
    <div v-if="$route.params.index >= 0">
      设置测试结果
      <el-button type="primary" plain @click="addResponse" size="mini">添加结果</el-button>
      <div v-for="(item, index) in caseDetail.responseConfig">
        <span>类型:</span>
        <span style="width: 80px;display: inline-block;">
          <bb-input-select v-model="item.type" :options="typeCodeList" edit-status></bb-input-select>
        </span>
        <template v-if="item.type == 'ajax'">
          <span>url:</span>
          <span style="width: 30%;display: inline-block;"><el-input v-model="item.url"></el-input></span>

          <span>请求方式:</span>
          <span style="width: 80px;display: inline-block;"><el-input v-model="item.method"></el-input></span>

          <span>结果: 默认状态码>=200 <300为成功</span>
        </template>
        <template v-if="item.type == 'newTab'">
          <span>url:</span>
          <span style="width: 30%;display: inline-block;"><el-input v-model="item.url"></el-input></span>
          <span>结果: 默认检查打开tab网址</span>
        </template>
        <el-button type="danger" @click="deleteRespConfig(index)" size="mini">删除</el-button>
      </div>
    </div>
    <div
      v-for="(item,index) in caseDetail.eventList"
      :key="index"
      :style="getRowStyle(index)"
      @click="setFieldData(item,index)"
    >
      <event-item :list="caseDetail.eventList" :item="item" :itemIndex="index"/>
      <el-button v-if="$route.params.index >= 0" type="danger" @click="deleteEvent(index)" size="mini">删除</el-button>
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
import BbInputSelect from '../components/input-select'
import {mapGetters} from 'vuex'
import EventItem from '../components/event-item'
export default {
  components: {
    EventItem,
    'bb-input-select': BbInputSelect
  },
  props: {
    caseIndex: {
      type: Number
    }
  },
  data () {
    return {
      luzhiDialogStatus: false,
      currentEventIndex: -1,
      clickIndex: -1,

      typeCodeList: [
        {name: 'ajax请求', code: 'ajax'},
        {name: '打开新页面', code: 'newTab'}
      ]
    }
  },
  computed: {
    ...mapGetters(['backgroundPageConnection', 'caseList', 'current', 'disconnect']),
    index () {
      return this.caseIndex >= 0 ? this.caseIndex : this.$route.params.index
    },
    caseDetail () {
      return this.caseList[this.index] ? this.caseList[this.index] : {eventList: []}
    }
  },
  created () {

  },
  mounted () {

  },
  methods: {
    getRowStyle (index) {
      let style = {
        background: 'transparent'
      }
      if (this.clickIndex === index ) {
        style.background = '#c158ca'
        style.color = '#fff'
      } else if (this.currentEventIndex === index) {
        style.background = '#67C23A'
        style.color = '#fff'
      }
      return style
    },
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
    // runCase () {
    //   // 连接bg
    //   this.$store.commit('connect')
    //   this.backgroundPageConnection.postMessage({
    //     type: 'run-case',
    //     tabId: chrome.devtools.inspectedWindow.tabId,
    //     case: JSON.parse(JSON.stringify(this.caseDetail))
    //   })
    // },
    async oneByOneRunCase (callback) {
      // 连接bg
      this.$store.commit('connect')
      await this.startEventList(JSON.parse(JSON.stringify(this.caseDetail)))
      callback && callback()
    },
    async startEventList (vm) {
      for (let i = 0; i < vm.eventList.length; i++) {
        let item = vm.eventList[i]
        await this.sleep(item.time)
        this.postRunMessage(i)
      }
      this.currentEventIndex = -1
      this.$emit('runEnd')
    },
    postRunMessage (i) {
      if (!this.caseDetail.eventList[i]) {
        this.currentEventIndex = -1
        this.$emit('runEnd')
        return false
      }
      this.currentEventIndex = i
      this.backgroundPageConnection.postMessage({
        type: 'run-one-case',
        tabId: chrome.devtools.inspectedWindow.tabId,
        case: this.caseDetail.eventList[i],
        index: i
      })
      return true
    },
    sleep (time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, time)
      })
    },
    deleteEvent (index) {
      this.caseDetail.eventList.splice(index, 1)
    },
    addResponse () {
      if (!this.caseDetail['responseConfig']) {
        this.$set(this.caseDetail, 'responseConfig', [])
      }
      this.$nextTick(() => {
        this.caseDetail.responseConfig.push({
          type: 'ajax',
          url: '',
          method: ''
        })
      })
    },
    deleteRespConfig (index) {
      this.caseDetail['responseConfig'].splice(index, 1)
    },
    setFieldData (eventObj,index) {
      this.clickIndex = index
      // 显示右边详细信息 可修改什么的
      this.$emit('clickEventItem', eventObj)
    }
  }
}
</script>

<style>
</style>
