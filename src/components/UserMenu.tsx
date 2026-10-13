"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleUserRound, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  userEmail: string;
  onLogout: () => void;
}

export function UserMenu({ userEmail, onLogout }: UserMenuProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const handleLogout = () => {
    onLogout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
      variant: "info",
    });
  };

  const handleNavigateToProfile = () => {
    router.push("/profile");
  };

  const getInitials = (email: string) => {
    const name = email?.split('@')[0];
    return name?.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(userEmail)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="flex items-center gap-2" disabled>
          <User className="h-4 w-4" />
          <span className="text-sm">{userEmail}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleNavigateToProfile} className="flex cursor-pointer items-center gap-2">
          <CircleUserRound className="h-4 w-4" />
          <span className="text-sm">Profile & security</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
