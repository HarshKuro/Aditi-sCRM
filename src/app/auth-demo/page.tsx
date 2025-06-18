'use client';

import { useSession } from 'next-auth/react';
import { useRoleCheck, withRoleAuth } from '@/lib/auth-guards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, FileText } from 'lucide-react';

function AuthDemoPage() {
  const { data: session } = useSession();
  const { hasRequiredRole: isAdmin } = useRoleCheck(['Admin']);
  const { hasRequiredRole: isManagerOrAdmin } = useRoleCheck(['Admin', 'Manager']);

  const user = session?.user;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Authentication & Role Demo</h1>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={user?.role === 'Admin' ? 'default' : user?.role === 'Manager' ? 'secondary' : 'outline'}>
                {user?.role || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-xs">{user?.id || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-based Access Demo */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Admin Only */}
        <Card className={!isAdmin ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Admin Only Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ You have admin access!</p>
                <Button className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600">❌ Admin access required</p>
                <Button disabled className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager or Admin */}
        <Card className={!isManagerOrAdmin ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Manager+ Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isManagerOrAdmin ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ Manager/Admin access!</p>
                <Button className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600">❌ Manager+ access required</p>
                <Button disabled className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Implementation Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">HOC Usage:</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`// Protect entire component
const AdminOnlyPage = withRoleAuth(MyComponent, { 
  allowedRoles: ['Admin'] 
});

// With custom redirect
const ManagerPage = withRoleAuth(MyComponent, { 
  allowedRoles: ['Admin', 'Manager'],
  redirectTo: '/unauthorized'
});`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Hook Usage:</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`// Check roles in components
const { hasRequiredRole } = useRoleCheck(['Admin']);

// Conditional rendering
{hasRequiredRole && (
  <AdminOnlyButton />
)}`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">API Route Protection:</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`// Protect API endpoints
export const handler = withAuth(async (req, session) => {
  // Your protected API logic
}, ['Admin']);

// Manual checks
const session = await requireAdmin(request);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Example of HOC usage - protect the entire page for Admin only
export default withRoleAuth(AuthDemoPage, {
  allowedRoles: ['Admin', 'Manager', 'Employee'], // Allow all authenticated users
  redirectTo: '/login'
});
