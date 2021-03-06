import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    backgroundPageConnection: null,
    current: 0,
    caseList: [],
    disconnect: true
  },
  actions: {},
  mutations: {
    connect (state) {
      state.backgroundPageConnection = chrome.runtime.connect({
        name: "panel"
      })
    },
    setCaseList (state, list) {
      state.caseList = list
    },
    deleteCase (state, index){
      state.caseList.splice(index, 1)
    },
    setDisConnect (state, bool) {
      state.disconnect = bool
    },
    setCurrent (state, index) {
      state.current = index
    }
  },
  getters: {
    backgroundPageConnection: state => state.backgroundPageConnection,
    current: state => state.current,
    caseList: state => state.caseList,
    disconnect: state => state.disconnect
  }
})

export default store
