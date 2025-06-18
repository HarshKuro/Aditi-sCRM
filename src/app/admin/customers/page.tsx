'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { withRoleAuth } from '@/lib/auth-guards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/shared/page-header';
import { 
  Users, 
  Search, 
  Filter, 
  UserCog, 
  Eye, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { ViewCustomerDialog } from "@/components/customers/view-customer-dialog";

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  visaType?: string;
  status: 'Lead' | 'Prospect' | 'Customer' | 'Inactive';
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Filters {
  countries: string[];
  visaTypes: string[];
  employees: Employee[];
  statuses: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function AdminCustomersPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<Filters>({
    countries: [],
    visaTypes: [],
    employees: [],
    statuses: ['Lead', 'Prospect', 'Customer', 'Inactive']
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedVisaType, setSelectedVisaType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Reassignment dialog
  const [reassignDialog, setReassignDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newAssignee, setNewAssignee] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Editing customer
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Viewing customer
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCountry) params.append('country', selectedCountry);
      if (selectedVisaType) params.append('visaType', selectedVisaType);
      if (selectedEmployee) params.append('assignedTo', selectedEmployee);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        setPagination(data.pagination || pagination);
        if (data.filters) {
          setFilters(data.filters);
        }
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCountry, selectedVisaType, selectedEmployee, selectedStatus, toast]);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchCustomers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCountry, selectedVisaType, selectedEmployee, selectedStatus]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle reassignment
  const handleReassign = async () => {
    if (!selectedCustomer || !newAssignee) return;
    
    setReassigning(true);
    try {
      const response = await fetch(`/api/customers/${selectedCustomer._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo: newAssignee || null
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer reassigned successfully',
        });
        setReassignDialog(false);
        setSelectedCustomer(null);
        setNewAssignee('');
        fetchCustomers();
      } else {
        throw new Error('Failed to reassign customer');
      }
    } catch (error) {
      console.error('Error reassigning customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to reassign customer',
        variant: 'destructive',
      });
    } finally {
      setReassigning(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (customer: Customer, newStatus: string) => {
    try {
      const response = await fetch(`/api/customers/${customer._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer status updated',
        });
        fetchCustomers();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer status',
        variant: 'destructive',
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedVisaType('');
    setSelectedEmployee('');
    setSelectedStatus('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lead': return <Badge variant="secondary">{status}</Badge>;
      case 'Prospect': return <Badge variant="outline">{status}</Badge>;
      case 'Customer': return <Badge variant="default">{status}</Badge>;
      case 'Inactive': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Customer Management"
        description="View, filter, and manage all customers in the system"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="outline" onClick={fetchCustomers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Country</Label>
              <Select 
                value={selectedCountry} 
                onValueChange={setSelectedCountry}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  {filters.countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visa Type</Label>
              <Select 
                value={selectedVisaType} 
                onValueChange={setSelectedVisaType}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Visa Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Visa Types</SelectItem>
                  {filters.visaTypes.map((visaType) => (
                    <SelectItem key={visaType} value={visaType}>
                      {visaType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assigned To</Label>
              <Select 
                value={selectedEmployee} 
                onValueChange={setSelectedEmployee}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Employees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {filters.employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.name} ({employee.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={setSelectedStatus}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {filters.statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Customers ({pagination.total})</span>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <Alert>
              <AlertDescription>
                No customers found matching your criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Visa Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.company && (
                              <p className="text-sm text-muted-foreground">{customer.company}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {customer.email && (
                              <p className="text-sm">{customer.email}</p>
                            )}
                            {customer.phone && (
                              <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.country || '-'}
                        </TableCell>
                        <TableCell>
                          {customer.visaType ? (
                            <Badge variant="outline">{customer.visaType}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.status)}
                        </TableCell>
                        <TableCell>
                          {customer.assignedTo ? (
                            <div>
                              <p className="text-sm font-medium">{customer.assignedTo.name}</p>
                              <p className="text-xs text-muted-foreground">{customer.assignedTo.role}</p>
                            </div>
                          ) : (
                            <Badge variant="secondary">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(customer.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {customer.createdBy?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setViewingCustomer(customer);
                                setIsViewDialogOpen(true);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setNewAssignee(customer.assignedTo?._id || '');
                                  setReassignDialog(true);
                                }}
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                Reassign
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditingCustomer(customer);
                                setIsEditDialogOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              {session?.user?.role === 'Admin' && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} customers
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialog} onOpenChange={setReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Customer</DialogTitle>
            <DialogDescription>
              Change the employee assigned to {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assign To</Label>
              <Select 
                value={newAssignee} 
                onValueChange={setNewAssignee}
                disabled={reassigning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassign</SelectItem>
                  {filters.employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.name} ({employee.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={reassigning}>
              {reassigning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                'Reassign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ViewCustomerDialog
        customer={viewingCustomer}
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) setViewingCustomer(null);
        }}
      />

      <AddCustomerDialog
        mode="edit"
        customer={editingCustomer}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingCustomer(null);
        }}
        onCustomerAdded={() => {
          setEditingCustomer(null);
          setIsEditDialogOpen(false);
          fetchCustomers();
        }}
      />
    </div>
  );
}

// Protect this page - Admin and Manager only
export default withRoleAuth(AdminCustomersPage, {
  allowedRoles: ['Admin', 'Manager'],
  redirectTo: '/unauthorized'
});
