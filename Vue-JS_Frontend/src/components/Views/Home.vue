<script setup>
import { ref } from 'vue'
import All from './Tab/All.vue'
import Workflows from './Tab/Workflows.vue'
import price_card from '../prices/price_card.vue'

const currentComponent = ref('All')

const components = {
  All,
    Workflows
}
</script>

<template>
    <div class="home">
        <div class="home-title">
    <h1 class="home-title__title">Every tool you need to work with PDFs in one place</h1>
    <p class="home-title__subtitle">Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.</p>
</div>
    
    <div class="button-container">
        <button @click="currentComponent = 'All'">All</button>
        <button @click="currentComponent = 'Workflows'">Workflows</button>
        <button @click="currentComponent = 'Workflows'">
Organize PDF</button>
<button @click="currentComponent = 'Workflows'">Optimize PDF</button>
<button @click="currentComponent = 'Workflows'">Convert PDF</button>
<button @click="currentComponent = 'Workflows'">Edit PDF</button>
<button @click="currentComponent = 'Workflows'">PDF Security</button>
    </div>
    <div class="button-container-area">
        <component :is="components[currentComponent]"></component>
    </div>
    <price_card/>
    </div>
</template>
<style scoped>
 
.home-title {
    text-align: center;
    margin-top: 50px;
} 
.home-title__title{
    font-weight: 600;
    font-size: 42px;
    line-height: 52px;
    color: #33333b;
    text-align: center;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 4px;
}
.home-title__subtitle {
    line-height: 32px;
    font-size: 22px;
    font-weight: 400;
    color: #47474f;
    max-width: 980px;
    margin: auto;
}
.button-container {
    text-align: center;
    margin-top: 30px;
    display: flex;
    gap:5px;
    justify-content: center;
        flex-wrap: wrap;
}
.button-container button {
    border-radius: 50px;
    padding:5px 10px;
    border: 2px solid #ccc;
    background-color: transparent;
}
.button-container button:hover {
    background-color: #ffbb7b;
}
.button-container-area {
    margin-top: 30px;
    margin-inline: 10px;
}
@media (max-width: 1024px){
    .home-title__title{
        font-size: 28px;
        line-height: 30px;
        margin-bottom: 20px;
    }
    .home-title__subtitle {
        font-size: 16px;
        line-height: 28px;
    }
}
</style>