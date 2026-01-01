import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/components/Views/Home.vue'
import Features from '@/components/Views/Features.vue';


const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: Home
		},
		{
			path:'/features',
			component: Features
		},
        {
			path: '/service',
			component: () => import('@/components/Views/Service.vue')
		},
	],
})

export default router