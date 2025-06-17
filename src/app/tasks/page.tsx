"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockTasks, mockCustomers, mockUsers } from "@/lib/mock-data";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { useSession } from "next-auth/react";
import { PlusCircle, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, AlertTriangle, ArrowUp, ArrowDown, CheckCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { format, isPast, differenceInDays } from 'date-fns';

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
  if (isPast(new Date(dueDate)) && priority !== 'Low') { // Don't escalate 'Low' just for being past due
    effectivePriority = 'High';
  } else if (daysUntilDue <=2 && daysUntilDue >=0 && priority === 'Medium') {
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
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");

  const filteredTasks = useMemo(() => {
    return mockTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      const matchesAssignment = user?.role === 'Admin' || task.assignedEmployeeId === user?.id;
      return matchesSearch && matchesStatus && matchesAssignment;
    });
  }, [searchTerm, statusFilter, user]);

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "N/A";
    return mockCustomers.find(c => c.id === customerId)?.name || "Unknown Customer";
  }

  const getEmployeeName = (employeeId: string) => {
    return mockUsers.find(u => u.id === employeeId)?.name || "Unknown";
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Task Management" description="Track and manage your tasks efficiently.">
        <Button>
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
            {filteredTasks.map((task) => (
              <TableRow key={task.id} className={isPast(new Date(task.dueDate)) && task.status !== 'Completed' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                <TableCell className="text-center">
                  <PriorityIndicator priority={task.priority} dueDate={task.dueDate} />
                </TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(task.status)}>{task.status}</Badge>
                </TableCell>
                <TableCell>{format(new Date(task.dueDate), "MMM d, yyyy")}</TableCell>
                <TableCell>{getCustomerName(task.customerId)}</TableCell>
                <TableCell>{getEmployeeName(task.assignedEmployeeId)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit Task</DropdownMenuItem>
                      {user?.role === 'Admin' && <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete Task</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {filteredTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
