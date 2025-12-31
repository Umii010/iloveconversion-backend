import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/components/Views/Home.vue'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: Home
		},
        {
			path: '/service',
			component: () => import('@/components/Views/Service.vue')
		},
	],
})

export default router