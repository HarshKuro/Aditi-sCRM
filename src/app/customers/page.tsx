"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockCustomers, mockUsers } from "@/lib/mock-data";
import type { Customer, CustomerStatus } from "@/lib/types";
import { useSession } from "next-auth/react";
import { PlusCircle, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from 'date-fns';

const getStatusColor = (status: CustomerStatus) => {
  switch (status) {
    case 'Lead': return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
    case 'Prospect': return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'; // Using theme's primary might be too strong for a badge bg
    case 'Customer': return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
  }
};

export default function CustomersPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "All">("All");

  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || customer.status === statusFilter;
      const matchesAssignment = user?.role === 'Admin' || customer.assignedEmployeeId === user?.id;
      return matchesSearch && matchesStatus && matchesAssignment;
    });
  }, [searchTerm, statusFilter, user]);

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Unassigned";
    return mockUsers.find(u => u.id === employeeId)?.name || "Unknown";
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Management" description="View, search, and manage your customers.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search customers by name, email, company..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> 
              Status: {statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {["All", "Lead", "Prospect", "Customer"].map(status => (
              <DropdownMenuItem key={status} onSelect={() => setStatusFilter(status as CustomerStatus | "All")}>
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.company}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(customer.status)}>{customer.status}</Badge>
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{getEmployeeName(customer.assignedEmployeeId)}</TableCell>
                <TableCell>{format(new Date(customer.updatedAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit Customer</DropdownMenuItem>
                      {user?.role === 'Admin' && <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Customer</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
