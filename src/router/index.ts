import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { auth_routes, default_routes, admin_routes } from './routes';
import { useAuth } from '@/composables/useAuth';

/**
 * Basic navigation guard to check for authentication status.
 */
const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const auth = useAuth();

  try {
    // Ensure auth composable is available
    if (!auth) {
      console.error('Auth composable not available');
      return next('/auth/login');
    }

    // Public routes do not require authentication
    if (!to.meta.requiresAuth) {
      return next();
    }

    // Check if a valid session or token is available
    const hasSession = localStorage.getItem('auth_token');
    // const isAuthenticated = await auth.initializeAuth().catch(() => !!hasSession);

    if (!hasSession) {
      return next({
        path: '/auth/login',
        query: { redirect: to.fullPath },
      });
    }

    // Redirect authenticated users away from auth pages
    // if (to.path.startsWith('/auth') && auth.isAuthenticated.value) {
    //   return next({ name: 'dashboard' });
    // }

    // Proceed if authenticated
    return next();
  } catch (error) {
    console.error('Navigation error:', error);
    await auth.logout();
    return next({
      path: '/auth/login',
      query: { error: 'auth_error', redirect: to.fullPath },
    });
  }
};

/**
 * Simple title management.
 */
const updatePageTitle = (to: RouteLocationNormalized) => {
  const baseTitle = 'Service Management System';
  document.title = to.meta.title
    ? `${to.meta.title} | ${baseTitle}`.replace(/[<>]/g, '')
    : baseTitle;
};

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...auth_routes,
    ...default_routes,
    ...admin_routes,
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/error/NotFoundPage.vue'),
      meta: { title: 'Page Not Found' },
    },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

// Apply navigation guards
router.beforeEach(authGuard);
router.beforeEach(updatePageTitle);

export default router;