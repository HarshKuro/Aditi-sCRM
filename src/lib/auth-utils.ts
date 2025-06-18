import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';

export type UserRole = 'Admin' | 'Manager' | 'Employee';

/**
 * Get session from API route
 */
export async function getAuthSession(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return null;
    }

    return {
      user: {
        id: token.sub,
        email: token.email,
        name: token.name,
        role: token.role as UserRole,
      },
    };
  } catch (error) {
    console.error('Error getting auth session:', error);
    return null;
  }
}

/**
 * Middleware function to check authentication
 */
export async function requireAuth(request: NextRequest) {
  const session = await getAuthSession(request);
  
  if (!session) {
    throw new AuthError('Authentication required', 401);
  }

  return session;
}

/**
 * Middleware function to check role-based authorization
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
) {
  const session = await requireAuth(request);
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }

  return session;
}

/**
 * Middleware function for admin-only access
 */
export async function requireAdmin(request: NextRequest) {
  return requireRole(request, ['Admin']);
}

/**
 * Middleware function for admin and manager access
 */
export async function requireAdminOrManager(request: NextRequest) {
  return requireRole(request, ['Admin', 'Manager']);
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Utility function to handle auth errors in API routes
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  console.error('Unexpected auth error:', error);
  return {
    error: 'Internal server error',
    statusCode: 500,
  };
}

/**
 * Wrapper for API route handlers with authentication
 */
export function withAuth(
  handler: (request: NextRequest, session: any) => Promise<Response>,
  allowedRoles?: UserRole[]
) {
  return async (request: NextRequest, context?: any) => {
    try {
      let session;
      
      if (allowedRoles) {
        session = await requireRole(request, allowedRoles);
      } else {
        session = await requireAuth(request);
      }

      return await handler(request, session);
    } catch (error) {
      const { error: message, statusCode } = handleAuthError(error);
      return Response.json({ error: message }, { status: statusCode });
    }
  };
}

/**
 * Check if user has permission to access customer data
 */
export function canAccessCustomer(
  userRole: UserRole,
  userId: string,
  customerId: string,
  assignedCustomerIds: string[] = []
): boolean {
  // Admins can access all customers
  if (userRole === 'Admin') {
    return true;
  }

  // Managers can access customers in their team (implement team logic as needed)
  if (userRole === 'Manager') {
    return true; // Implement team-based logic here
  }

  // Employees can only access their assigned customers
  if (userRole === 'Employee') {
    return assignedCustomerIds.includes(customerId);
  }

  return false;
}
