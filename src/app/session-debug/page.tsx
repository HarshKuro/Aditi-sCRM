'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SessionDebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Session Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Status:</strong> {status}
            </div>
            
            {session ? (
              <div>
                <strong>Session Data:</strong>
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <strong>Session:</strong> No session found
              </div>
            )}
            
            <div className="pt-4">
              <a href="/login" className="text-primary hover:underline">
                Go to Login
              </a>
              {' | '}
              <a href="/dashboard" className="text-primary hover:underline">
                Go to Dashboard
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
