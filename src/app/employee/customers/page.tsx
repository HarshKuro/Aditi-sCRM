'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/shared/page-header';
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Tag,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Mail,
  Building,
  Globe
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

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  visaType?: string;
  status: 'Lead' | 'Prospect' | 'Customer' | 'Inactive';
  temperature?: 'hot' | 'warm' | 'cold';
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
  lastUpdatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function EmployeeCustomersPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  // Early return if no session
  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTemperature, setSelectedTemperature] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [stats, setStats] = useState({
    Lead: 0,
    Prospect: 0,
    Customer: 0,
    Inactive: 0
  });
  
  // Update dialog
  const [updateDialog, setUpdateDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    temperature: '',
    notes: '',
    tags: ''
  });
  const [updating, setUpdating] = useState(false);

  // Available tags from all customers
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        assignedTo: session?.user?.id || '', // Only get assigned customers
      });
      
      // Only add filters if they are not set to 'all'
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedTemperature && selectedTemperature !== 'all') params.append('temperature', selectedTemperature);
      if (selectedTag && selectedTag !== 'all') params.append('tag', selectedTag);

      const response = await fetch(`/api/customers?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || pagination);
      setStats(data.stats || { Lead: 0, Prospect: 0, Customer: 0, Inactive: 0 });
      if (data.filters) {
        setAvailableTags(Array.from(new Set(data.customers.flatMap((c: any) => c.tags || []))));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedStatus, selectedTemperature, selectedTag, session?.user?.id]);
  // Initial load
  useEffect(() => {
    if (session?.user?.id) {
      fetchCustomers();
    }
  }, [session?.user?.id, fetchCustomers]);

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
  }, [searchTerm, selectedStatus, selectedTemperature]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  // Open update dialog
  const openUpdateDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setUpdateForm({
      status: customer.status || 'Lead',
      temperature: customer.temperature || 'warm',
      notes: customer.notes || '',
      tags: (customer.tags || []).join(', ')
    });
    setUpdateDialog(true);
  };

  // Handle customer update
  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/customers/${selectedCustomer._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: updateForm.status,
          temperature: updateForm.temperature,
          notes: updateForm.notes,
          tags: updateForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        });
        setUpdateDialog(false);
        setSelectedCustomer(null);
        fetchCustomers();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update customer',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedTemperature('all');
    setSelectedTag('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lead': return <Badge variant="secondary">{status}</Badge>;
      case 'Prospect': return <Badge variant="outline">{status}</Badge>;
      case 'Customer': return <Badge variant="default">{status}</Badge>;
      case 'Inactive': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get temperature badge
  const getTemperatureBadge = (temp?: string) => {
    if (!temp) return null;
    
    const variants = {
      hot: { variant: 'destructive' as const, icon: '🔥', label: 'Hot' },
      warm: { variant: 'default' as const, icon: '🌡️', label: 'Warm' },
      cold: { variant: 'secondary' as const, icon: '❄️', label: 'Cold' }
    };
    
    const config = variants[temp as keyof typeof variants];
    if (!config) return null;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <span>{config.icon}</span>
        {config.label}
      </Badge>
    );
  };  // Filter customers by tag if selected
  const filteredCustomers = useMemo(() => {
    if (!selectedTag || selectedTag.trim() === '') {
      return customers;
    }
    return customers.filter(customer => 
      customer.tags && Array.isArray(customer.tags) && customer.tags.includes(selectedTag)
    );
  }, [customers, selectedTag]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="My Customers"
        description="Manage and update your assigned customers"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(stats).reduce((a, b) => a + b, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <span className="text-lg">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.Lead}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <span className="text-lg">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.Customer}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <span className="text-lg">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.Prospect}</div>
          </CardContent>
        </Card>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus || 'all'} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Temperature</Label>
              <Select value={selectedTemperature || 'all'} onValueChange={setSelectedTemperature}>
                <SelectTrigger>
                  <SelectValue placeholder="All Temperatures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Temperatures</SelectItem>
                  <SelectItem value="hot">🔥 Hot</SelectItem>
                  <SelectItem value="warm">🌡️ Warm</SelectItem>
                  <SelectItem value="cold">❄️ Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tag</Label>
              <Select value={selectedTag || 'all'} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.filter(tag => tag && tag.trim().length > 0).map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
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
              <span>Your Customers ({filteredCustomers.length})</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredCustomers.length === 0 ? (
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
                      <TableHead>Status</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.company && (
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Building className="h-3 w-3 mr-1" />
                                {customer.company}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.email && (
                              <p className="text-sm flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {customer.email}
                              </p>
                            )}
                            {customer.phone && (
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {customer.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {customer.country && (
                              <p className="text-sm flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                {customer.country}
                              </p>
                            )}
                            {customer.visaType && (
                              <Badge variant="outline" className="mt-1">
                                {customer.visaType}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.status)}
                        </TableCell>
                        <TableCell>
                          {getTemperatureBadge(customer.temperature)}
                        </TableCell>                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(customer.tags || []).slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {(customer.tags || []).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(customer.tags || []).length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(customer.updatedAt).toLocaleDateString()}
                            </p>
                            {customer.lastUpdatedBy && (
                              <p className="text-xs text-muted-foreground">
                                by {customer.lastUpdatedBy.name}
                              </p>
                            )}
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
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openUpdateDialog(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Add Note
                              </DropdownMenuItem>
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

      {/* Update Dialog */}
      <Dialog open={updateDialog} onOpenChange={setUpdateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Update Customer</span>
            </DialogTitle>
            <DialogDescription>
              Update status, temperature, and notes for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={updateForm.status || 'Lead'} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Select value={updateForm.temperature || 'warm'} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, temperature: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select temperature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">🔥 Hot</SelectItem>
                    <SelectItem value="warm">🌡️ Warm</SelectItem>
                    <SelectItem value="cold">❄️ Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={updateForm.tags}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="priority, follow-up, interested"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={updateForm.notes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this customer..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Protect this page - Employee, Manager, and Admin access
export default withRoleAuth(EmployeeCustomersPage, {
  allowedRoles: ['Employee', 'Manager', 'Admin'],
  redirectTo: '/unauthorized'
});
