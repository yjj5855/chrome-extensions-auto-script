<template>
  <div id="app">
    <el-row type="flex">
      <el-col style="flex: 1;max-height: 100vh;overflow-y: auto;">
        <el-row class="border-bottom">
          <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">脚本名称</el-col>
          <el-col :span="4" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">宽/高</el-col>
          <el-col :span="4" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">操作数量</el-col>
          <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">操作</el-col>
        </el-row>
        <el-row
          class="border-bottom script-item"
          style="cursor: pointer;"
          v-for="(item,index) in caseList"
          :key="index"
          :style="{background: runningCaseIndex === index ? 'hsl(99, 54%, 95%)': 'transparent'}"
          @click.native="showDetail(index)"
        >
          <el-col :span="8" class="table-td" style="height: 48px;display: flex;align-items: center;">
            <edit-div v-model="item.name"></edit-div>
          </el-col>
          <el-col :span="4" class="table-td" style="height: 48px;display: flex;align-items: center;">
            {{item.width}}px / {{item.height}}px
          </el-col>
          <el-col :span="4" class="table-td" style="height: 48px;display: flex;align-items: center;">
            {{item.eventList.length}}
          </el-col>
          <el-col :span="8" class="table-td script-action">
            <div class="padding-8-0">
              <el-button type="text" v-if="!importFlag" @click.stop="startLuzhi(index)">开始录制</el-button>
              <el-button type="text" @click.stop="deleteCase(index)">删除</el-button>
              <el-button type="text" @click.stop="runCase(index)">执行</el-button>
              <el-button type="text" v-if="!importFlag" @click.stop="goDetail(index)">详情</el-button>
            </div>
          </el-col>
        </el-row>
        <div style="min-height: 15px;"></div>
        <div style="padding-left: 8px;">
          <el-button round type="primary" @click="addCase">添加测试脚本</el-button>
          <el-button round type="success" @click="saveData">保存数据</el-button>
          <el-button round type="primary" @click="batchRun">批量执行</el-button>
          <el-button round type="warning" @click="exportScript">导出脚本</el-button>
          <div style="min-height: 10px;"></div>
          <el-upload
            class="upload-demo"
            action="123"
            :multiple="false"
            :show-file-list="false"
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            :before-upload="importScript">
            <el-button round type="warning">导入脚本</el-button>
          </el-upload>
        </div>
        <div style="min-height: 30px;"></div>
        <div>
          <el-row class="border-bottom">
            <el-col :span="8" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">脚本名称</el-col>
            <el-col :span="16" class="table-td padding-8-0" style="font-weight: bold;color: #909399;">测试结果</el-col>
          </el-row>
          <el-row class="border-bottom" v-for="(val, key) in result" :key="key">
            <el-col :span="8" class="table-td padding-8-0">
              {{key}}
            </el-col>
            <el-col :span="16" class="table-td padding-8-0">
              <div v-for="(item, index) in val" :key="index">
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
      </el-col>
      <div class="border-left" style="height: 100vh;"></div>
      <el-col style="flex: 1;">
        <case-detail
          v-if="runningCaseIndex >= 0"
          ref="caseDetail"
          :case-index="runningCaseIndex"
          @runEnd="handleRunCaseEnd"
        />
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
import XLSX from 'xlsx'
import {workbook2blob, openDownloadDialog, readWorkbookFromLocalFile, getHeaderKeyList} from '../assets/xlsx'
import {mapGetters} from 'vuex'
import editDiv from '../components/edit-div'
import caseDetail from './caseDetail'

const fixedHeader = ['name', 'urlPath', 'width', 'height', 'eventList', 'responseConfig']
export default {
  components: {
    caseDetail,
    'edit-div': editDiv
  },
  data () {
    return {
      luzhiDialogStatus: false,
      runningCaseIndex: -1,
      result: {},

      chooseEvent: {},
      importFlag: false
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
  watch: {
  },
  created () {
  },
  mounted () {
    this.$EventBus.$on('run-case', async ({index, sendResponse}) => {
      await this.runCase(index)
      sendResponse(this.result[this.caseList[index].name])
    })
  },
  beforeDestroy() {
    this.$EventBus.$off('run-case')
  },
  methods: {
    // tab-activated
    onTabActivated (activatedTab) {
      // console.log('onEventBus tab-activated', activatedTab)
      if (this.runningCaseIndex !== -1 &&  Array.isArray(this.caseList[this.runningCaseIndex].responseConfig)) {
        let pendingUrl = this.$getUrlPath(activatedTab.pendingUrl)
        let configList = this.caseList[this.runningCaseIndex].responseConfig.filter(item => item.type === 'newTab')
        configList.forEach(config => {
          if (pendingUrl.endsWith(config.url)) {
            this.result[this.caseList[this.runningCaseIndex].name].push({
              type: config.type,
              url: activatedTab.pendingUrl
            })
          }
        })
      }
      // 目前方式是 直接关闭tab
      setTimeout(() => {
        if (+activatedTab.id !== +chrome.devtools.inspectedWindow.tabId) {
          this.backgroundPageConnection.postMessage({
            type: 'remove-tab',
            tabId: activatedTab.id
          })
        }
      }, 2000)
    },
    // 测试请求响应
    onRequestFinished (request) {
      // 1. 判断当前执行的脚本是否配置了response
      // 2. 匹配结果,输出表格
      let requestUrl = this.$getUrlPath(request.request.url)
      if ((request._resourceType === 'xhr' || request._resourceType === 'fetch') &&
        this.runningCaseIndex !== -1 &&
        Array.isArray(this.caseList[this.runningCaseIndex].responseConfig)
      ) {
        // console.log('onRequestFinished', requestUrl)
        let configList = this.caseList[this.runningCaseIndex].responseConfig.filter(item => item.type === 'ajax')
        configList.forEach(config => {
          if (requestUrl.endsWith(config.url) && request.request.method === config.method.toUpperCase()){
            this.result[this.caseList[this.runningCaseIndex].name].push({
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
      chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
        let urlPath = this.$getOnlyUrl(tab.url)
        chrome.windows.get(tab.windowId, (window) => {
          this.caseList.push({
            name: '脚本名称',
            urlPath: urlPath,
            eventList: [],
            // 获取到tab窗口大小
            width: window.width,
            height: window.height
          })
        })
      })
    },
    startLuzhi (index) {
      this.luzhiDialogStatus = true
      this.$store.commit('setCurrent', index)

      this.backgroundPageConnection.postMessage({
        type: 'bind',
        tabId: chrome.devtools.inspectedWindow.tabId,
        width: this.currentCaseDetail.width,
        height: this.currentCaseDetail.height
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
      if (this.importFlag) {
        this.$alert('之前录制的脚本将被覆盖!确定要保存导入的数据吗?', '保存提示', {
          confirmButtonText: '确定',
          callback: action => {
            if (action === 'confirm') {
              this.backgroundPageConnection.postMessage({
                type: 'save-case',
                tabId: chrome.devtools.inspectedWindow.tabId,
                data: JSON.parse(JSON.stringify(this.caseList))
              })
            }
          }
        })
      } else {
        this.backgroundPageConnection.postMessage({
          type: 'save-case',
          tabId: chrome.devtools.inspectedWindow.tabId,
          data: JSON.parse(JSON.stringify(this.caseList))
        })
      }
    },
    deleteCase (index) {
      this.$store.commit('deleteCase', index)
    },
    async runCase (index = null, item) {
      return new Promise((resolve, reject) => {
        this.$EventBus.$on('tab-activated', this.onTabActivated)
        chrome.devtools.network.onRequestFinished.addListener(this.onRequestFinished)
        if (index === null) {
          let i = this.caseList.findIndex(caseItem => caseItem === item)
          index = i
        }
        this.runningCaseIndex = index
        // 初始化并清空之前的测试结果
        if (this.caseList[this.runningCaseIndex].responseConfig) {
          this.$set(this.result, this.caseList[this.runningCaseIndex].name, [])
        } else {
          delete this.result[this.caseList[this.runningCaseIndex].name]
          // this.$set(this.result, , undefined)
        }
        this.$nextTick(async () => {
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
      this.$nextTick(() => {
        this.runningCaseIndex = -1
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
    showDetail (index) {
      this.runningCaseIndex = index
      // this.$nextTick(() => {
      //   if (this.$refs['caseDetail']) {
      //     this.$refs['caseDetail'].postChangeWidthHeightMessage()
      //   }
      // })
    },
    goDetail (index) {
      this.$router.push({name: 'caseDetail', params: {index}})
    },
    exportScript () {
      // 创建一个工作薄
      let workBook = XLSX.utils.book_new()

      // 一个脚本一个sheet 方便之后批量导入运行
      this.caseList.forEach(item => {
        // 创建sheet对象
        let sheetData = []
        let headers = JSON.parse(JSON.stringify(fixedHeader))
        // 抽出 eventList 输入事件中定义字段名称的列
        item.eventList
          .filter(event => event.type === 'set-input-value' && event.key && !headers.includes(event.key))
          .forEach(event => {
            item[event.key] = event.value
            headers.unshift(event.key)
          })
        let caseRow = {
          ...item,
          eventList: JSON.stringify(item.eventList)
        }
        if (Array.isArray(item.responseConfig)) {
          caseRow.responseConfig = JSON.stringify(item.responseConfig)
        }
        sheetData.push(caseRow)

        let sheet = XLSX.utils.json_to_sheet(sheetData, {header: headers})

        // 在工作簿中添加sheet页
        XLSX.utils.book_append_sheet(workBook, sheet, item.name)
      })

      // 转化格式，导出文件
      // 创建工作薄blob
      const workbookBlob = workbook2blob(workBook)
      // 导出工作薄
      openDownloadDialog(workbookBlob, '自动化脚本.xlsx')
    },
    importScript (file) {
      readWorkbookFromLocalFile(file, wb => {
        /**
         * workBook => caseList:[]
         * 1. 先把sheets循环,知道有几个脚本
         * 2. 再把每个sheet中有几行循环, 知道每个脚本有几个用例
         * 3. 再整合成一个大的caseList
         */
        let caseList = []
        wb.SheetNames.forEach(sheetName => {
          let xlsxData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName])
          let allKeyList = getHeaderKeyList(wb.Sheets[sheetName])
          let customKeyList = allKeyList.filter(key => !fixedHeader.includes(key))
          let baseCaseDetail = {}
          let baseEventList = []
          xlsxData.forEach((data, index)=> {
            // 表格里可以只保留第一行的脚本数据 其他行配置变量 节省空间
            if (index === 0) {
              baseCaseDetail = {
                name: data.name,
                urlPath: data.urlPath,
                width: data.width,
                height: data.height
              }
              if (data.responseConfig && data.responseConfig.length > 5) {
                baseCaseDetail.responseConfig = JSON.parse(data.responseConfig)
              }
              try {
                baseEventList = JSON.parse(data.eventList) || []
              } catch (e) {
                console.error('解析eventList失败', e)
              }
            }
            // 处理eventList 把变量塞进去
            let eventList = []
            baseEventList.forEach(event => {
              if (event.type === 'set-input-value' && customKeyList.includes(event.key)) {
                event.value = data[event.key]
              }
              eventList.push(event)
            })
            caseList.push({
              ...baseCaseDetail,
              name: baseCaseDetail.name + '-' + index,
              eventList: JSON.parse(JSON.stringify(eventList))
            })
          })
        })
        this.$store.commit('setCaseList', caseList)
        this.importFlag = true
      })
      return false
    }
  }
}
</script>

<style>
  .script-item:hover .script-action{
    display: block;
  }
  .script-item .script-action{
    display: none;
  }

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
  .border-left {
    border-left: 1px solid #ebeef5;
  }
  .border-right {
    border-right: 1px solid #ebeef5;
  }
  .border-top {
    border-top: 1px solid #ebeef5;
  }
</style>
