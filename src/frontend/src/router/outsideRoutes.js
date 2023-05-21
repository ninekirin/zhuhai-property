import { lazy } from 'react';
export const outsideRoutes = [
  {
    path: '/',
    redirect: '/login',
    hidden: true,
  },
  {
    path: '/login',
    title: 'Login',
    meta: { title: '', roles: [] },
    component: lazy(() => import('@/pages/Login')),
  },
  {
    path: '/register',
    title: 'Register',
    meta: { title: '', roles: [] },
    component: lazy(() => import('@/pages/Register')),
  },
];
