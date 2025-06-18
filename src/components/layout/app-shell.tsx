
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Presentation,
  FileText,
  UserCog,
  LogOut,
  Settings,
  ChevronDown,
  Aperture,
  PanelLeftOpen,
  PanelLeftClose,
  Upload,
  BarChart3
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";


interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  role?: UserRole[]; // undefined means for all roles
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "My Customers", href: "/employee/customers", icon: Users, role: ["Employee", "Manager", "Admin"] },
  { title: "My Performance", href: "/employee/analytics", icon: BarChart3, role: ["Employee", "Manager", "Admin"] },
  { title: "Tasks", href: "/tasks", icon: ListChecks },
  { title: "Sales Pipeline", href: "/sales-pipeline", icon: Presentation },
  { title: "Reports", href: "/reports", icon: FileText, role: ["Admin"] },
  { title: "User Management", href: "/user-management", icon: UserCog, role: ["Admin"] },
  { title: "Employee Management", href: "/admin/employees", icon: Users, role: ["Admin"] },
  { title: "Customer Management", href: "/admin/customers", icon: UserCog, role: ["Admin", "Manager"] },
  { title: "Analytics Dashboard", href: "/admin/analytics", icon: BarChart3, role: ["Admin", "Manager"] },
  { title: "Import Customers", href: "/admin/import", icon: Upload, role: ["Admin"] },
  { title: "Admin Panel", href: "/admin", icon: Settings, role: ["Admin"] },
  { title: "Employee Portal", href: "/employee", icon: Users, role: ["Employee", "Admin"] },
  { title: "Shared Resources", href: "/shared", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
         <div className="w-64 space-y-4">
           <Skeleton className="h-12 w-full" />
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-2/3" />
         </div>
       </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to login
  }

  const user = session?.user;
  if (!user) {
    return null;
  }
  
  const accessibleNavItems = navItems.filter(item => !item.role || item.role.includes(user.role as UserRole));

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2 hover:no-underline">
            <Aperture className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Prospex
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {accessibleNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{children: item.title, side: 'right', align: 'center'}}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || ''} alt={user.name} data-ai-hint="profile person" />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-2 text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
                  <p className="text-xs text-sidebar-foreground/70">{user.role}</p>
                </div>
                <ChevronDown className="ml-auto h-4 w-4 text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
          <div className="md:hidden">
            <SidebarTriggerMobile />
          </div>
          <div className="flex-1">
            {/* Breadcrumbs or Page Title can go here */}
          </div>
          {/* Additional header controls can go here */}
        </header>
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


function SidebarTriggerMobile() {
  const { openMobile, setOpenMobile, state } = useSidebar()
  const Icon = openMobile || state === "expanded" ? PanelLeftClose : PanelLeftOpen;
  return (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0"
      onClick={() => setOpenMobile(!openMobile)}
      aria-label="Toggle sidebar"
    >
      <Icon className="h-5 w-5" />
    </Button>
  )
}

