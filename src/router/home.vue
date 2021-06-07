<template>
  <div id="app">
    <el-button round type="primary" @click="addCase">添加测试用例</el-button>
    <el-button round type="success" @click="saveData">保存数据</el-button>

    <el-row class="border-bottom">
      <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">用例名称</el-col>
      <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">操作数量</el-col>
      <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">操作</el-col>
    </el-row>
    <el-row class="border-bottom" v-for="(item,index) in caseList">
      <el-col :span="8" class="table-td padding-8-0">{{item.name}}</el-col>
      <el-col :span="8" class="table-td padding-8-0">{{item.eventList.length}}</el-col>
      <el-col :span="8" class="table-td padding-8-0">
        <el-button type="text" @click="startLuzhi(index)">开始录制</el-button>
        <el-button type="text" @click="deleteCase(index)">删除</el-button>
        <el-button type="text" @click="runCase(index)">执行</el-button>
        <el-button type="text" @click="goDetail(index)">详情</el-button>
      </el-col>
    </el-row>


    <el-dialog
      title="正在录制"
      :visible.sync="luzhiDialogStatus"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false">
      <div style="font-size: 18px;margin: 10px 0;text-align: center;">已录制 {{currentCaseDetail.eventList.length}} 个操作</div>
      <span slot="footer" class="dialog-footer">
        <el-button round type="danger" @click="endLuzhi">结束录制</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import endDialog from '../components/end-diaolog'
export default {
  components: {
    endDialog
  },
  data () {
    return {
      luzhiDialogStatus: false
    }
  },
  computed: {
    ...mapGetters(['backgroundPageConnection', 'caseList', 'current', 'disconnect']),
    currentCaseDetail () {
      if (this.caseList[this.current]) {
        return this.caseList[this.current]
      } else {
        return {eventList: []}
      }
    }
  },
  created () {
  },
  mounted () {
  },
  methods: {
    addCase () {
      this.caseList.push({name: '用例名称', eventList: []})
    },
    startLuzhi (index) {
      this.luzhiDialogStatus = true
      this.$store.commit('setCurrent', index)

      this.backgroundPageConnection.postMessage({
        type: 'bind',
        tabId: chrome.devtools.inspectedWindow.tabId
      })
    },
    endLuzhi () {
      // 发送页面监听消息
      this.backgroundPageConnection.postMessage({
        type: 'unbind',
        tabId: chrome.devtools.inspectedWindow.tabId,
      });
      this.luzhiDialogStatus = false
    },
    saveData () {
      this.backgroundPageConnection.postMessage({
        type: 'save-case',
        tabId: chrome.devtools.inspectedWindow.tabId,
        data: JSON.parse(JSON.stringify(this.caseList))
      });
    },
    deleteCase (index) {
      this.$store.commit('deleteCase', index)
    },
    runCase (index) {
      // 连接bg
      this.$store.commit('connect')
      this.backgroundPageConnection.postMessage({
        type: 'run-case',
        tabId: chrome.devtools.inspectedWindow.tabId,
        case: JSON.parse(JSON.stringify(this.caseList[index]))
      });
    },
    goDetail (index) {
      this.$router.push({name: 'caseDetail', params: {index}})
    }
  }
}
</script>

<style>
  .table-td {
    line-height: 23px;
    padding-right: 10px;
    padding-left: 10px;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-all;
    position: relative;
    vertical-align: middle;
  }
  .padding-8-0 {
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .border-bottom {
    border-bottom: 1px solid #ebeef5;
  }
</style>
