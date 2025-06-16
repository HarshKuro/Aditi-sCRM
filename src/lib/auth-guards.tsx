'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export type UserRole = 'Admin' | 'Manager' | 'Employee';

interface WithRoleAuthOptions {
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ComponentType;
}

/**
 * Higher-Order Component for role-based authentication
 * @param WrappedComponent - The component to protect
 * @param options - Configuration options for role-based access
 */
export function withRoleAuth<P extends {}>(
  WrappedComponent: ComponentType<P>,
  options: WithRoleAuthOptions = {}
) {
  const {
    allowedRoles = ['Admin', 'Manager', 'Employee'],
    redirectTo = '/unauthorized',
    fallback: Fallback,
  } = options;

  const AuthenticatedComponent = (props: P) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return; // Still loading

      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }

      if (session?.user && !allowedRoles.includes(session.user.role as UserRole)) {
        router.push(redirectTo);
        return;
      }
    }, [session, status, router]);

    // Loading state
    if (status === 'loading') {
      if (Fallback) {
        return <Fallback />;
      }
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="w-64 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        </div>
      );
    }

    // Not authenticated
    if (status === 'unauthenticated') {
      return null; // Will redirect to login
    }

    // Not authorized
    if (session?.user && !allowedRoles.includes(session.user.role as UserRole)) {
      return null; // Will redirect to unauthorized page
    }

    // Authenticated and authorized
    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withRoleAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

/**
 * Hook to check if current user has required role
 */
export function useRoleCheck(requiredRoles: UserRole[]) {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const userRole = session?.user?.role as UserRole;
  const hasRequiredRole = userRole && requiredRoles.includes(userRole);

  return {
    isLoading,
    isAuthenticated,
    hasRequiredRole,
    userRole,
  };
}

/**
 * Server-side role check utility
 */
export async function requireRole(
  allowedRoles: UserRole[],
  userRole?: string
): Promise<boolean> {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as UserRole);
}

// Utility components for common role combinations
export const AdminOnly = withRoleAuth;
export const AdminAndManager = (component: ComponentType<any>) =>
  withRoleAuth(component, { allowedRoles: ['Admin', 'Manager'] });
export const AllRoles = (component: ComponentType<any>) =>
  withRoleAuth(component, { allowedRoles: ['Admin', 'Manager', 'Employee'] });
