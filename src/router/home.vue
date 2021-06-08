<template>
  <div id="app">
    <el-button round type="primary" @click="addCase">添加测试用例</el-button>
    <el-button round type="success" @click="saveData">保存数据</el-button>

    <el-row class="border-bottom">
      <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">用例名称</el-col>
      <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">操作数量</el-col>
      <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">操作</el-col>
    </el-row>
    <el-row class="border-bottom" v-for="(item,index) in caseList" :style="{background: runningIndex === index ? '#f0f9eb' : '#fff'}">
      <el-col :span="8" class="table-td padding-8-0">
        <edit-div v-model="item.name"></edit-div>
      </el-col>
      <el-col :span="8" class="table-td padding-8-0">{{item.eventList.length}}</el-col>
      <el-col :span="8" class="table-td padding-8-0">
        <el-button type="text" @click="startLuzhi(index)">开始录制</el-button>
        <el-button type="text" @click="deleteCase(index)">删除</el-button>
        <el-button type="text" @click="runCase(index)">执行</el-button>
        <el-button type="text" @click="goDetail(index)">详情</el-button>
      </el-col>
    </el-row>
    <div style="min-height: 15px;"></div>
    <div>
      <el-button round type="primary" @click="batchRun">批量执行</el-button>
    </div>
    <div style="min-height: 30px;"></div>
    <div>
      <el-row class="border-bottom">
        <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">用例名称</el-col>
        <el-col :span="16" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">测试结果</el-col>
      </el-row>
      <el-row class="border-bottom" v-for="(val, key) in result">
        <el-col :span="8" class="table-td padding-8-0">
          {{key}}
        </el-col>
        <el-col :span="16" class="table-td padding-8-0">
          <div v-for="(item, index) in val">
            <span style="display: inline-block;min-width: 80px;">
              <el-tag v-if="item.type == 'ajax'" :type="item.method === 'DELETE' ? 'danger' : 'primary'">{{item.method}}</el-tag>
              <el-tag v-if="item.type == 'newTab'" type="primary">打开新页面</el-tag>
            </span>
            <span style="display: inline-block;min-width: 300px;">
              <el-tag type="info">{{item.url}}</el-tag>
            </span>
            <el-tag v-if="item.type == 'ajax'" :type="item.status > 400 ? 'danger' : 'success'">{{item.status}}</el-tag>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-drawer
      title="用例详情"
      :visible.sync="drawerStatus"
      :wrapperClosable="false"
      size="50%"
      direction="ltr">
      <case-detail ref="caseDetail" :case-index="runningIndex" @runEnd="handleRunCaseEnd"/>
    </el-drawer>

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
import editDiv from '../components/edit-div'
import caseDetail from './caseDetail'
export default {
  components: {
    caseDetail,
    'edit-div': editDiv
  },
  data () {
    return {
      drawerStatus: false,
      luzhiDialogStatus: false,
      runningIndex: -1,

      result: {}
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
    // tab-activated
    onTabActivated (activatedTab) {
      // console.log('onEventBus tab-activated', activatedTab)
      if (this.runningIndex !== -1 && this.caseList[this.runningIndex].responseConfig) {
        let configList = this.caseList[this.runningIndex].responseConfig.filter(item => item.type === 'newTab')
        configList.forEach(config => {
          if (activatedTab.pendingUrl.endsWith(config.url)) {
            this.result[this.caseList[this.runningIndex].name].push({
              type: config.type,
              url: activatedTab.pendingUrl
            })
          }
        })
      }
    },
    // 测试请求响应
    onRequestFinished (request) {
      // 1. 判断当前执行的用例是否配置了response
      // 2. 匹配结果,输出表格
      let requestUrl = getUrlPath(request.request.url)
      if ((request._resourceType === 'xhr' || request._resourceType === 'fetch') &&
        this.runningIndex !== -1 &&
        this.caseList[this.runningIndex].responseConfig
      ) {
        // console.log('onRequestFinished', requestUrl)
        let configList = this.caseList[this.runningIndex].responseConfig.filter(item => item.type === 'ajax')
        configList.forEach(config => {
          if (requestUrl.endsWith(config.url) && request.request.method === config.method.toUpperCase()){
            this.result[this.caseList[this.runningIndex].name].push({
              type: config.type,
              url: request.request.url,
              method: request.request.method,
              status: request.response.status
            })
          }
        })
      }
    },
    addCase () {
      this.caseList.push({
        name: '用例名称',
        eventList: []
      })
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
    async runCase (index) {
      return new Promise((resolve, reject) => {
        this.$EventBus.$on('tab-activated', this.onTabActivated)
        chrome.devtools.network.onRequestFinished.addListener(this.onRequestFinished)
        this.runningIndex = index
        // 初始化并清空之前的测试结果
        if (this.caseList[this.runningIndex].responseConfig) {
          this.$set(this.result, this.caseList[this.runningIndex].name, [])
        } else {
          this.$set(this.result, this.caseList[this.runningIndex].name, undefined)
        }
        this.$nextTick(async () => {
          this.drawerStatus = true
          this.$nextTick(async () => {
            if (this.$refs['caseDetail']) {
              this.$refs['caseDetail'].oneByOneRunCase(() => {
                resolve()
              })
            }
          })
        })
      })
    },
    handleRunCaseEnd () {
      this.$EventBus.$off('tab-activated')
      chrome.devtools.network.onRequestFinished.removeListener(this.onRequestFinished)
      this.drawerStatus = false
      this.$nextTick(() => {
        this.runningIndex = -1
      })
    },
    async batchRun () {
      const loading = this.$loading({
        lock: true,
        text: '批量运行中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.1)'
      })
      for (let i = 0; i < this.caseList.length; i++) {
        await this.runCase(i)
        await this.sleep(1000)
      }
      loading.close()
    },
    sleep (time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, time)
      })
    },
    goDetail (index) {
      this.$router.push({name: 'caseDetail', params: {index}})
    }
  }
}
function getUrlPath (url) {
  let index = url.indexOf('?')
  if (index >= 0) {
    url = url.substr(0, index)
  }
  return url
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
