"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { useSession } from "next-auth/react";
import { PlusCircle, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, AlertTriangle, ArrowUp, ArrowDown, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { format, isPast, differenceInDays } from 'date-fns';
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { useToast } from "@/components/ui/use-toast";

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
    case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200';
    case 'Completed': return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
  }
};

const PriorityIndicator = ({ priority, dueDate }: { priority: TaskPriority, dueDate: string }) => {
  const daysUntilDue = differenceInDays(new Date(dueDate), new Date());
  let effectivePriority = priority;
  if (isPast(new Date(dueDate)) && priority !== 'Low') {
    effectivePriority = 'High';
  } else if (daysUntilDue <= 2 && daysUntilDue >= 0 && priority === 'Medium') {
    effectivePriority = 'High';
  }

  switch (effectivePriority) {
    case 'High': return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'Medium': return <ArrowUp className="h-5 w-5 text-yellow-500" />;
    case 'Low': return <ArrowDown className="h-5 w-5 text-green-500"/>;
    default: return null;
  }
};

export default function TasksPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  
  // New state for customer filters
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCustomer) params.append('customerId', selectedCustomer);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [searchTerm, statusFilter, selectedCustomer]);

  const handleTaskAction = async (taskId: string, action: 'edit' | 'delete') => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: action === 'delete' ? 'DELETE' : 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} task`);
      }

      if (action === 'delete') {
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
        fetchTasks();
      } else {
        const task = await response.json();
        // Handle edit action - you can implement this later
        console.log('Edit task:', task);
      }
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} task. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Task Management" description="Track and manage your tasks efficiently.">
        <Button onClick={() => setIsAddTaskOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search tasks by title, description..." 
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
            {["All", "Pending", "In Progress", "Completed"].map(status => (
              <DropdownMenuItem key={status} onSelect={() => setStatusFilter(status as TaskStatus | "All")}>
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" /> 
              Customer: {selectedCustomer ? customers.find(c => c._id === selectedCustomer)?.name || 'All' : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Customer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSelectedCustomer("")}>
              All Customers
            </DropdownMenuItem>
            {customers.map(customer => (
              <DropdownMenuItem key={customer._id} onSelect={() => setSelectedCustomer(customer._id)}>
                {customer.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Priority</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Associated Customer</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading tasks...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task._id} className={isPast(new Date(task.dueDate)) && task.status !== 'Completed' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                  <TableCell className="text-center">
                    <PriorityIndicator priority={task.priority} dueDate={task.dueDate} />
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(task.status)}>{task.status}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(task.dueDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{task.customerId?.name || 'N/A'}</TableCell>
                  <TableCell>{task.assignedEmployeeId?.name || 'Unassigned'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTaskAction(task._id, 'edit')}>
                          <Eye className="mr-2 h-4 w-4" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTaskAction(task._id, 'edit')}>
                          <Edit className="mr-2 h-4 w-4" />Edit Task
                        </DropdownMenuItem>
                        {user?.role === 'Admin' && (
                          <DropdownMenuItem 
                            onClick={() => handleTaskAction(task._id, 'delete')}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Delete Task
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddTaskDialog 
        open={isAddTaskOpen} 
        onOpenChange={setIsAddTaskOpen}
        onTaskAdded={() => {
          fetchTasks();
          setIsAddTaskOpen(false);
        }} 
      />
    </div>
  );
}
