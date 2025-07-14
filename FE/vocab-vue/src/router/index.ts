import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Index.vue';
import Login from '../views/Login.vue';

const routes = [
    { path: '/login', name: 'Login', component: Login },
    { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('jwt');

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else {
        next();
    }
});