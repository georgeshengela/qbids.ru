import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  bidBalance: number;
  role: string;
}

interface AuthResponse {
  user: User;
}

let globalUser: User | null = null;
let globalLoading = true;

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(globalUser);
  const [isLoading, setIsLoading] = useState(globalLoading);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check localStorage for welcome modal flag
  useEffect(() => {
    const shouldShowWelcome = localStorage.getItem('showWelcomeModal');
    console.log('useEffect - checking localStorage flag:', shouldShowWelcome, 'user:', user?.username);
    if (shouldShowWelcome === 'true' && user) {
      console.log('Setting welcome modal to true');
      setShowWelcomeModal(true);
      localStorage.removeItem('showWelcomeModal');
    }
  }, [user]);

  useEffect(() => {
    if (globalLoading) {
      // Only check auth once on app startup
      fetch("/api/auth/me", { credentials: "include" })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          return { user: null };
        })
        .then(data => {
          globalUser = data.user || null;
          globalLoading = false;
          setUser(globalUser);
          setIsLoading(false);
        })
        .catch(() => {
          globalUser = null;
          globalLoading = false;
          setUser(null);
          setIsLoading(false);
        });
    } else {
      setUser(globalUser);
      setIsLoading(false);
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      globalUser = data.user;
      setUser(data.user);
      // Invalidate all queries to refresh data after login
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", credentials);
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      globalUser = data.user;
      setUser(data.user);
      // Set flag in localStorage to show welcome modal
      localStorage.setItem('showWelcomeModal', 'true');
      console.log('Registration success - setting localStorage flag and showing modal in 500ms');
      // Show welcome modal after a short delay to ensure auth modal closes first
      setTimeout(() => {
        console.log('Timeout reached - showing welcome modal');
        setShowWelcomeModal(true);
      }, 500);
      // Invalidate all queries to refresh data after registration
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      globalUser = null;
      setUser(null);
      queryClient.clear();
    },
  });

  const refetch = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        globalUser = data.user || null;
        setUser(globalUser);
      } else {
        globalUser = null;
        setUser(null);
      }
    } catch (error) {
      globalUser = null;
      setUser(null);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    registerPending: registerMutation.isPending,
    refetch,
    showWelcomeModal,
    setShowWelcomeModal,
  };
}
