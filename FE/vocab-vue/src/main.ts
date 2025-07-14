import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if (token) {
    localStorage.setItem('jwt', token);
    window.history.replaceState({}, '', '/'); // clean up URL
}

const app = createApp(App);
app.use(ElementPlus);
app.use(router);
app.mount('#app');