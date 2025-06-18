export type UserRole = 'Admin' | 'Manager' | 'Employee';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  avatar?: string;
  _id: string;
  email: string;
}

export type CustomerStatus = 'Lead' | 'Prospect' | 'Customer';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  assignedEmployeeId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  _id: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  customerId: Customer | null;
  assignedEmployeeId: User;
  createdBy: User;
  lastUpdatedBy: User;
  createdAt: string;
  updatedAt: string;
}

export type SalesStage = 'Qualification' | 'Proposal' | 'Closed Won' | 'Closed Lost';

export interface Sale {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized for display
  amount: number;
  stage: SalesStage;
  probability: number; // Percentage e.g. 75 for 75%
  expectedCloseDate: string;
  assignedEmployeeId: string;
  createdAt: string;
  updatedAt: string;
}
