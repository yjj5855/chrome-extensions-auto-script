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
  </div>
</template>

<script>
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
              // 发送eventbus home.vue 执行时监听
              this.$EventBus.$emit('tab-activated', message.tab)
              break
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
