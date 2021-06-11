import Vue from 'vue'
import ElementUI from 'element-ui'
import { sync } from 'vuex-router-sync'
import router from './router'
import store from './store'
import App from './Main.vue'
import 'element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
sync(store, router)
Vue.use(ElementUI, { size: 'small', zIndex: 3000 })

Vue.prototype.$EventBus = new Vue()

Vue.prototype.$getHost = getHost
Vue.prototype.$getUrlPath = getUrlPath
Vue.prototype.$getOnlyUrl = getOnlyUrl
function getHost (url) {
  // 必须是http开头或者https开头，结尾为'/'
  let reg = /^http(s)?:\/\/(.*?)\//
  let host = reg.exec(url)[2]
  return host
}
function getUrlPath (url) {
  let index = url.indexOf('?')
  if (index >= 0) {
    url = url.substr(0, index)
  }
  return url
}
function getOnlyUrl (url) {
  let urlPath = getUrlPath(url)
  let host = getHost(url)
  return urlPath.replace(new RegExp('^http(s)?:\/\/' + host), '')
}

/* eslint-disable no-new */
let app = new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
