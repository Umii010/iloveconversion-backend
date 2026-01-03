import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/components/Views/Home.vue'
import Features from '@/components/Views/Features.vue';
import DeveloperTools from '@/components/Views/DeveloperToolsPage.vue'
import DeveloperToolsPage from '@/components/Views/DeveloperToolsPage.vue';
import CodeDiffTool from '@/components/Views/CodeDiffTool.vue';
import VideoDownloader from '@/components/Views/VideoDownloader.vue';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: Home
		},
		{
			path: '/video-downloader',
			component: VideoDownloader
		},
		{
			path: '/code-difference',
			component: CodeDiffTool
		},
		{
			path:'/qr-code',
			component: Features
		},
		{
			path:'/developer-tools',
			component: DeveloperToolsPage
		},
        {
			path: '/service',
			component: () => import('@/components/Views/DeveloperToolsPage.vue')
		},
	],
})

export default router