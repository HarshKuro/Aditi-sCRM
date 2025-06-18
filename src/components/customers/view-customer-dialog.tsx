"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  };
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ViewCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewCustomerDialog({ customer, open, onOpenChange }: ViewCustomerDialogProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
              <p className="mt-1">{customer.name}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
              <Badge className="mt-1" variant={
                customer.status === 'Lead' ? 'default' :
                customer.status === 'Prospect' ? 'secondary' :
                customer.status === 'Customer' ? 'success' : 'destructive'
              }>
                {customer.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
              <p className="mt-1">{customer.email || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Phone</h3>
              <p className="mt-1">{customer.phone || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Company</h3>
              <p className="mt-1">{customer.company || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Country</h3>
              <p className="mt-1">{customer.country || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Visa Type</h3>
              <p className="mt-1">{customer.visaType || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Assigned To</h3>
              <p className="mt-1">{customer.assignedTo?.name || '-'}</p>
            </div>
          </div>

          {customer.notes && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
              <p className="mt-1 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">
                Created: {format(new Date(customer.createdAt), 'PPp')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Updated: {format(new Date(customer.updatedAt), 'PPp')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 