"use client";

import type { User, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  login: (username_role_combo: string, pin: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('prospexUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username_role_combo: string, pin: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let foundUser: User | undefined;
    let expectedPin: string | undefined;

    if (username_role_combo === 'admin') {
        foundUser = mockUsers.find(u => u.username === 'admin' && u.role === 'Admin');
        expectedPin = 'Admin123!';
    } else if (username_role_combo === 'employee1') {
        foundUser = mockUsers.find(u => u.username === 'employee1' && u.role === 'Employee');
        expectedPin = 'Emp123!';
    }


    if (foundUser && pin === expectedPin) {
      setUser(foundUser);
      localStorage.setItem('prospexUser', JSON.stringify(foundUser));
      setIsLoading(false);
      router.push('/dashboard');
      toast({ title: "Login Successful", description: `Welcome back, ${foundUser.name}!` });
      return true;
    } else {
      setIsLoading(false);
      toast({ title: "Login Failed", description: "Invalid credentials. Please try again.", variant: "destructive" });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prospexUser');
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
