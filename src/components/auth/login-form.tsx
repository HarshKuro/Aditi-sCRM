"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const loginSchema = z.object({
  role: z.string().min(1, "Please select a role"),
  pin: z.string().min(1, "PIN is required"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    setError(null);
    const success = await login(data.role, data.pin);
    if (!success) {
      setError("Invalid credentials. Please check your role and PIN.");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <ControllerSelect control={control} name="role" defaultValue="">
          <SelectTrigger id="role">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin (admin / Admin123!)</SelectItem>
            <SelectItem value="employee1">Employee (employee1 / Emp123!)</SelectItem>
          </SelectContent>
        </ControllerSelect>
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pin">PIN</Label>
        <Input
          id="pin"
          type="password"
          {...register('pin')}
          placeholder="Enter your PIN"
          className={errors.pin ? "border-destructive" : ""}
        />
        {errors.pin && <p className="text-sm text-destructive">{errors.pin.message}</p>}
      </div>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Login Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Demo Credentials</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside text-sm">
            <li>Admin: Role: Admin, PIN: Admin123!</li>
            <li>Employee: Role: Employee, PIN: Emp123!</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="mr-2 h-4 w-4" />
        )}
        Sign In
      </Button>
    </form>
  );
}

// Helper component for react-hook-form Controller with Shadcn Select
import { Controller, Control } from 'react-hook-form';

interface ControllerSelectProps {
  control: Control<any>;
  name: string;
  children: React.ReactNode;
  defaultValue?: string;
}

function ControllerSelect({ control, name, children, defaultValue }: ControllerSelectProps) {
  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          {children}
        </Select>
      )}
    />
  );
}
