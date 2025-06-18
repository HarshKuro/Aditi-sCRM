import type { User, Customer, Task, Sale, UserRole, CustomerStatus, TaskStatus, SalesStage, TaskPriority } from './types';

export const mockUsers: User[] = [
  { id: 'admin1', username: 'admin', role: 'Admin', name: 'Admin User', avatar: 'https://placehold.co/100x100' },
  { id: 'emp1', username: 'employee1', role: 'Employee', name: 'John Doe', avatar: 'https://placehold.co/100x100' },
  { id: 'emp2', username: 'employee2', role: 'Employee', name: 'Jane Smith', avatar: 'https://placehold.co/100x100' },
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust1',
    name: 'Tech Solutions Inc.',
    email: 'contact@techsolutions.com',
    phone: '555-0101',
    company: 'Tech Solutions Inc.',
    status: 'Prospect',
    assignedEmployeeId: 'emp1',
    notes: 'Interested in enterprise package. Follow up next week.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust2',
    name: 'Innovate Hub',
    email: 'info@innovatehub.io',
    phone: '555-0102',
    company: 'Innovate Hub',
    status: 'Customer',
    assignedEmployeeId: 'emp1',
    notes: 'Long-term client, very satisfied.',
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cust3',
    name: 'Alpha Corp',
    email: 'support@alphacorp.com',
    phone: '555-0103',
    company: 'Alpha Corp',
    status: 'Lead',
    assignedEmployeeId: 'emp2',
    notes: 'New lead from website.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
    {
    id: 'cust4',
    name: 'Beta Co',
    email: 'sales@betaco.com',
    phone: '555-0104',
    company: 'Beta Co',
    status: 'Prospect',
    assignedEmployeeId: 'emp2',
    notes: 'Evaluating proposal.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task1',
    title: 'Follow up with Tech Solutions',
    description: 'Discuss enterprise package details and pricing.',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'In Progress',
    priority: 'High',
    customerId: 'cust1',
    assignedEmployeeId: 'emp1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task2',
    title: 'Prepare Q3 report for Innovate Hub',
    description: 'Compile usage data and prepare presentation.',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    priority: 'Medium',
    customerId: 'cust2',
    assignedEmployeeId: 'emp1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task3',
    title: 'Initial contact with Alpha Corp',
    description: 'Introduce Prospex CRM and its benefits.',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    priority: 'High',
    customerId: 'cust3',
    assignedEmployeeId: 'emp2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task4',
    title: 'Send proposal to Beta Co',
    description: 'Finalize and send the tailored proposal.',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Past due
    status: 'Completed',
    priority: 'Low', // Was high, now completed
    customerId: 'cust4',
    assignedEmployeeId: 'emp2',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockSales: Sale[] = [
  {
    id: 'sale1',
    customerId: 'cust1',
    customerName: 'Tech Solutions Inc.',
    amount: 15000,
    stage: 'Proposal',
    probability: 60,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    assignedEmployeeId: 'emp1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sale2',
    customerId: 'cust4',
    customerName: 'Beta Co',
    amount: 8000,
    stage: 'Qualification',
    probability: 25,
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    assignedEmployeeId: 'emp2',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sale3',
    customerId: 'cust2', // Existing customer, new deal
    customerName: 'Innovate Hub',
    amount: 25000,
    stage: 'Closed Won',
    probability: 100,
    expectedCloseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    assignedEmployeeId: 'emp1',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to simulate API delay
export const simulateDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));
