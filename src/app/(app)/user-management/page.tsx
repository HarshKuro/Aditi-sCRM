"use client";

import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockUsers } from "@/lib/mock-data";
import type { User as UserType, UserRole } from "@/lib/types";
import { PlusCircle, Search, MoreHorizontal, Edit, Trash2, AlertTriangle, ShieldCheck, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case 'Admin':
      return <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground"><ShieldCheck className="mr-1 h-3 w-3"/>Admin</Badge>;
    case 'Employee':
      return <Badge variant="secondary"><UserCheck className="mr-1 h-3 w-3"/>Employee</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function UserManagementPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && user && user.role !== 'Admin') {
      router.replace('/dashboard'); // Redirect non-admins
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'Admin') {
     return (
      <div className="flex h-full items-center justify-center">
        <AlertTriangle className="h-10 w-10 text-destructive mr-2" /> 
        <p className="text-xl">Access Denied or Loading...</p>
      </div>
    );
  }

  const filteredUsers = mockUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage user accounts and roles.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search users by name or username..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((managedUser: UserType) => (
              <TableRow key={managedUser.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                       <AvatarImage src={managedUser.avatar} alt={managedUser.name} data-ai-hint="profile person" />
                       <AvatarFallback>{managedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{managedUser.name}</span>
                  </div>
                </TableCell>
                <TableCell>{managedUser.username}</TableCell>
                <TableCell>{getRoleBadge(managedUser.role)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={managedUser.id === user.id && managedUser.role === 'Admin'}> {/* Prevent admin from editing self easily */}
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled={managedUser.id === user.id && managedUser.role === 'Admin'}><Edit className="mr-2 h-4 w-4" />Edit User</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={managedUser.id === user.id && managedUser.role === 'Admin'}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
