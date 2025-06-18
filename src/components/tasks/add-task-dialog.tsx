"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskPriority, TaskStatus } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

interface Customer {
  _id: string;
  name: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded: () => void;
}

export function AddTaskDialog({ open, onOpenChange, onTaskAdded }: AddTaskDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [status, setStatus] = useState<TaskStatus>("Pending");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [customerId, setCustomerId] = useState<string>("");

  // Fetch customers when dialog opens
  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      // Handle both paginated and non-paginated responses
      const customerList = data.customers || data;
      setCustomers(Array.isArray(customerList) ? customerList : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          dueDate: dueDate.toISOString(),
          status,
          priority,
          customerId: customerId || null,
          assignedEmployeeId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      onOpenChange(false);
      onTaskAdded();
      
      // Reset form
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setStatus("Pending");
      setPriority("Medium");
      setCustomerId("");
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  disabled={loading}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="customer" className="text-sm font-medium">Associated Customer</label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 