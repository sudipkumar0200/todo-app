
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "@/components/ui/sonner";

type User = {
  id: string;
  email: string;
  name: string;
  country: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, country: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
};

// API Configuration
// const API_BASE_URL = "http://localhost:3001/api/v1"; // Update with your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
// const mockUsers = [
//   {
//     id: "1",
//     email: "john@example.com",
//     password: "password",
//     name: "John Doe",
//     country: "USA",
//   },
//   {
//     id: "2",
//     email: "jane@example.com",
//     password: "password",
//     name: "Jane Smith",
//     country: "Canada",
//   },
// ];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize user synchronously from localStorage so auth is persistent across
  // page refreshes and components don't get a null user on first render.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? (JSON.parse(storedUser) as User) : null;
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      return null;
    }
  });

  const login = async (email: string, password: string): Promise<boolean> => {
       try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Invalid email or password");
        return false;
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      
      toast.success("Login successful!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
      return false;
    }

    // const foundUser = mockUsers.find(
    //   (u) => u.email === email && u.password === password
    // );

    // if (foundUser) {
    //   const { password, ...userWithoutPassword } = foundUser;
    //   localStorage.setItem("user", JSON.stringify(userWithoutPassword));
    //   setUser(userWithoutPassword);
    //   toast.success("Login successful!");
    //   return true;
    // }

    // toast.error("Invalid email or password");
    // return false;
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    country: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, country }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to create account");
        return false;
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      
      toast.success("Account created successfully!");
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An error occurred during signup");
      return false;
    }
  };

  const logout = () => {
    /* ============================================
       BACKEND API CALL (Uncomment when backend is ready)
       ============================================
    // Optional: Call backend logout endpoint if you want to invalidate tokens server-side
    // const token = localStorage.getItem("authToken");
    // if (token) {
    //   fetch(`${API_BASE_URL}/auth/logout`, {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Bearer ${token}`,
    //     },
    //   }).catch(console.error);
    // }
    ============================================ */

    // Clear local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully!");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
