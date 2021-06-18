<template>
  <div style="height:100%;">
    <el-alert
      v-if="disconnect"
      style="margin-bottom: 15px;"
      title="已断开和bg的连接"
      type="error"
      show-icon
      center>
      <div>
        所有操作都不会执行,请关闭开发者模式,再刷新页面后再打开开发者模式!
        <el-button type="text" @click="reConnect">重新连接</el-button>
      </div>
    </el-alert>
    <router-view class="router-view"></router-view>
    <div style="position:fixed;left: 15px;bottom: 15px;">tabId: {{tabId}}</div>
  </div>
</template>

<script>
  import Vue from 'vue'
  import {mapGetters} from 'vuex'
  export default {
    created () {
      console.log('devtool created')
      this.init()
    },
    mounted () {
      console.log('devtool mounted')
    },
    computed: {
      ...mapGetters(['backgroundPageConnection', 'caseList', 'current', 'disconnect'])
    },
    data () {
      return {
        tabId: ''
      }
    },
    methods: {
      reConnect () {
        this.$store.commit('connect')
        // 发送初始化连接消息
        this.backgroundPageConnection.postMessage({
          name: 'init',
          tabId: chrome.devtools.inspectedWindow.tabId
        })
      },
      init () {
        this.tabId = chrome.devtools.inspectedWindow.tabId
        // 连接bg
        this.$store.commit('connect')

        this.backgroundPageConnection.onMessage.addListener((message) => {
          console.log('devtools收到了bg的消息', message)
          switch (message.type) {
            case 'connected':
              this.$store.commit('setDisConnect', false)
              break
            case 'init-caseList':
              this.$store.commit('setCaseList', JSON.parse(JSON.stringify(message.data)))
              break
            case 'add-event':
              this.caseList[this.current].eventList.push(message.event)
              break
            case 'tab-activated':
              if (message.tab) {
                // 发送eventbus home.vue 执行时监听
                this.$EventBus.$emit('tab-activated', message.tab)
              }
              break
            case 'get-caseList':
              if (this.caseList.length === 0) {
                return
              }
              chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
                this.backgroundPageConnection.postMessage({
                  type: 'get-caseList',
                  notifyTabId: message.notifyTabId,
                  tabDetail: {
                    tab: tab,
                    caseList: this.caseList
                  }
                })
              })
              break
          }
        })

        /**
         * 长连接没有sendResponse回调, 所以使用这种方式回调
         */
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
          let message = msg.data
          console.log('devtool chrome.runtime.onMessage', msg)
          if (+msg.tabId === +chrome.devtools.inspectedWindow.tabId && message) {
            switch (message.type) {
              case 'run-case':
                // 1. 找到脚本 并替换变量
                // 2. 执行脚本
                let index = this.caseList.findIndex(item => item.name === message.name)
                if (index < 0) {return}
                let newCase = JSON.parse(JSON.stringify(this.caseList[index]))
                newCase.eventList = newCase.eventList.map(event => {
                  if (event.type === 'set-input-value' && event.key in message.customKey) {
                    event.value = message.customKey[event.key]
                  }
                  return event
                })
                Vue.set(this.caseList, index, newCase)
                this.$EventBus.$emit('run-case', {index, sendResponse})
                return true
            }
          }
        })
        // 发送初始化连接消息
        this.backgroundPageConnection.postMessage({
          name: 'init',
          tabId: chrome.devtools.inspectedWindow.tabId
        })
        this.backgroundPageConnection.postMessage({
          type: 'init-caseList',
          tabId: chrome.devtools.inspectedWindow.tabId
        })

        let self = this
        this.backgroundPageConnection.onDisconnect.addListener((port) => {
          console.log('devtool 断开了连接', port)
          self.$store.commit('setDisConnect', true)
        })
      }
    }
  }
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }
  body {
    margin: 0!important;
  }
</style>
