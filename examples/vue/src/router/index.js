import Vue from 'vue'
import Router from 'vue-router'
import Ideogram from '@/components/Ideogram'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Ideogram',
      component: Ideogram
    }
  ]
})
