import { clerkMiddleware } from '@clerk/astro/server';

const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/analytics',
  '/attendance',
  '/ats-checker',
  '/faculty-diary',
  '/pdf-tools',
];

export const onRequest = clerkMiddleware((auth, context, next) => {
  const url = new URL(context.request.url);
  const isProtected = protectedRoutes.some((route) => url.pathname.startsWith(route));

  if (isProtected && !auth().userId) {
    return auth().redirectToSignIn();
  }
  return next();
});
