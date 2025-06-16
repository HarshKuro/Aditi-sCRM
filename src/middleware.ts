import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*', 
    '/tasks/:path*',
    '/reports/:path*',
    '/sales-pipeline/:path*',
    '/user-management/:path*',
  ],
};
