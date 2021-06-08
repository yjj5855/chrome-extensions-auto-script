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

/* eslint-disable no-new */
let app = new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
