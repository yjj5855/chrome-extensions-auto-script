import Vue from 'vue'
import Router from 'vue-router'
import home from './home'
import caseDetail from './caseDetail'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: home,
      meta: {title: '首页'}
    },
    {
      path: '/case/:index',
      name: 'caseDetail',
      component: caseDetail,
      meta: {title: '用例详情'}
    },
  ]
})
