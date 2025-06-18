"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Loader2 } from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  visaType?: string;
  status: 'Lead' | 'Prospect' | 'Customer' | 'Inactive';
  notes?: string;
}

interface AddCustomerDialogProps {
  onCustomerAdded: () => void;
  customer?: Customer | null;
  mode?: 'add' | 'edit';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddCustomerDialog({ 
  onCustomerAdded, 
  customer = null, 
  mode = 'add',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: AddCustomerDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [visaType, setVisaType] = useState("");
  const [status, setStatus] = useState<'Lead' | 'Prospect' | 'Customer' | 'Inactive'>('Lead');
  const [notes, setNotes] = useState("");

  // Handle controlled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);

  // Load customer data when editing
  useEffect(() => {
    if (mode === 'edit' && customer) {
      setName(customer.name);
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setCompany(customer.company || '');
      setCountry(customer.country || '');
      setVisaType(customer.visaType || '');
      setStatus(customer.status);
      setNotes(customer.notes || '');
    }
  }, [customer, mode]);

  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(newOpen);
    }
    setOpen(newOpen);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setCountry("");
    setVisaType("");
    setStatus('Lead');
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const url = mode === 'edit' && customer 
        ? `/api/customers/${customer._id}` 
        : "/api/customers";
      
      const method = mode === 'edit' ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          country,
          visaType,
          status: status || 'Lead',
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${mode} customer`);
      }

      handleOpenChange(false);
      onCustomerAdded();
      
      if (mode === 'add') {
        resetForm();
      }
      
      toast({
        title: "Success",
        description: `Customer ${mode === 'edit' ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error(`Error ${mode}ing customer:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode} customer`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {mode === 'add' && (
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {mode === 'edit' 
                ? 'Update customer information below.'
                : 'Add a new customer to your CRM. Fill in the customer\'s details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Customer name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visaType">Visa Type</Label>
                <Input
                  id="visaType"
                  placeholder="Visa type"
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
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
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Customer' : 'Create Customer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 