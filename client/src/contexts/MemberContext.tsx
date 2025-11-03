import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "@/components/ui/sonner";

// API Configuration
const API_BASE_URL = "http://localhost:3000/api"; // Update with your backend URL
// const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth token

// import { createContext, useContext, useState, ReactNode, useEffect } from "react";
// import { toast } from "@/components/ui/sonner";
import { useAuth } from "./AuthContext";

// // API Configuration
// const API_BASE_URL = "http://localhost:3000/api"; // Update with your backend URL

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem("authToken");

export type TaskStatus = "todo" | "in-progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  memberId: string;
  createdAt: Date;
  completedAt: Date | null;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  userId?: string;
  createdAt: Date;
  createdById: string;
  user?: {
    name: string;
  };
};

type MemberContextType = {
  members: Member[];
  tasks: Task[];
  addMember: (member: Omit<Member, "id" | "createdAt">) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedAt">) => void;
  updateTask: (id: string, updatedTask: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // getMemberTasks: (memberId: string) => Task[];
  getMemberTasks: (memberId: string) => Promise<Task[]>;
  getUserMembers: (userId: string) => Member[];
  canManageTask: (taskId: string) => boolean;
};

// Mock data
// const mockMembers: Member[] = [
//   {
//     id: "1",
//     name: "Sarah Johnson",
//     email: "sarah@example.com",
//     role: "Frontend Developer",
//     userId: "1",
//     createdAt: new Date("2023-01-10"),
//   },
//   {
//     id: "2",
//     name: "Michael Chen",
//     email: "michael@example.com",
//     role: "Backend Developer",
//     userId: "1",
//     createdAt: new Date("2023-02-15"),
//   },
//   {
//     id: "3",
//     name: "Emily Rodriguez",
//     email: "emily@example.com",
//     role: "UI/UX Designer",
//     userId: "2",
//     createdAt: new Date("2023-03-01"),
//   },
// ];

// const mockTasks: Task[] = [
//   {
//     id: "1",
//     title: "Design Homepage",
//     description: "Create wireframes for the homepage",
//     status: "completed",
//     priority: "high",
//     dueDate: new Date("2025-11-01"),
//     memberId: "1",
//     createdAt: new Date("2023-01-15"),
//     completedAt: new Date("2023-01-20"),
//   },
//   {
//     id: "2",
//     title: "Develop Navigation",
//     description: "Create responsive navigation menu",
//     status: "in-progress",
//     priority: "urgent",
//     dueDate: new Date("2025-10-28"),
//     memberId: "1",
//     createdAt: new Date("2023-01-21"),
//     completedAt: null,
//   },
//   {
//     id: "3",
//     title: "User Authentication",
//     description: "Implement login and signup functionality",
//     status: "todo",
//     priority: "high",
//     dueDate: new Date("2025-10-30"),
//     memberId: "2",
//     createdAt: new Date("2023-02-16"),
//     completedAt: null,
//   },
//   {
//     id: "4",
//     title: "Create Social Media Posts",
//     description: "Design posts for Facebook and Instagram",
//     status: "review",
//     priority: "medium",
//     dueDate: new Date("2025-11-05"),
//     memberId: "3",
//     createdAt: new Date("2023-03-05"),
//     completedAt: null,
//   },
// ];

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const MemberProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch members on mount (when backend is ready)
  useEffect(() => {
    const fetchMembers = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMembers(
            data.members.map((m: any) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Member functions
  const addMember = async (member: Omit<Member, "id" | "createdAt">) => {
    // Only admins can add members
    if (user?.role !== "admin") {
      toast.error("Only admins can add members");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(member),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to add member");
        return;
      }

      const data = await response.json();
      const newMember = {
        ...data,
        createdAt: new Date(data.createdAt),
      };

      setMembers([...members, newMember]);
      toast.success("Member added successfully");
    } catch (error) {
      console.error("Add member error:", error);
      toast.error("An error occurred while adding member");
    }

    // MOCK IMPLEMENTATION (Remove when backend is ready)
    // const newMember = {
    //   ...member,
    //   id: `${members.length + 1}`,
    //   createdAt: new Date(),
    // };

    // setMembers([...members, newMember]);
    // toast.success(
    //   `Member added successfully. Login credentials sent to ${member.email}. Default password: 123456`
    // );
  };

  // Task functions
  const addTask = async (
    task: Omit<Task, "id" | "createdAt" | "completedAt">
  ) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/members/${task.memberId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to create task");
        return;
      }

      const data = await response.json();
      const newTask = {
        ...data,
        dueDate: new Date(data.dueDate),
        createdAt: new Date(data.createdAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
      };

      setTasks([...tasks, newTask]);
      toast.success("Task created successfully");
    } catch (error) {
      console.error("Add task error:", error);
      toast.error("An error occurred while creating task");
    }

    // MOCK IMPLEMENTATION (Remove when backend is ready)
    const newTask = {
      ...task,
      id: `${tasks.length + 1}`,
      createdAt: new Date(),
      completedAt: null,
    };

    setTasks([...tasks, newTask]);
    toast.success("Task created successfully");
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/members/${task.memberId}/tasks/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedTask),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to update task");
        return;
      }

      const data = await response.json();
      const updated = {
        ...data,
        dueDate: new Date(data.dueDate),
        createdAt: new Date(data.createdAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
      };

      setTasks(tasks.map((t) => (t.id === id ? updated : t)));
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("An error occurred while updating task");
    }

    // MOCK IMPLEMENTATION (Remove when backend is ready)
    // setTasks(
    //   tasks.map((task) => {
    //     if (task.id === id) {
    //       const completedAt =
    //         updatedTask.status === "completed" && task.status !== "completed"
    //           ? new Date()
    //           : task.completedAt;

    //       return { ...task, ...updatedTask, completedAt };
    //     }
    //     return task;
    //   })
    // );
    // toast.success("Task updated successfully");
  };

  const deleteTask = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/members/${task.memberId}/tasks/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to delete task");
        return;
      }

      setTasks(tasks.filter((task) => task.id !== id));
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Delete task error:", error);
      toast.error("An error occurred while deleting task");
    }

    // MOCK IMPLEMENTATION (Remove when backend is ready)
    // setTasks(tasks.filter((task) => task.id !== id));
    // toast.success("Task deleted successfully");
  };

  // Helper functions
  // const getMemberTasks = (memberId: string) => {
  //   const memberTasks = tasks.filter((task) => task.memberId === memberId);

  //   // If user is admin, return all tasks
  //   if (user?.role === "admin") {
  //     return memberTasks;
  //   }

  //   // If user is member, only return tasks for members with their email
  //   if (user?.role === "member") {
  //     const member = members.find((m) => m.id === memberId);
  //     if (member && member.email === user.email) {
  //       return memberTasks;
  //     }
  //     return [];
  //   }

  //   return memberTasks;
  // };
  const getMemberTasks = async (memberId: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in");
      return [];
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/member/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to fetch tasks");
        return [];
      }

      const data = await response.json();

      // Convert date strings to Date objects for frontend use
      const fetchedTasks: Task[] = data.tasks.map((t: any) => ({
        ...t,
        dueDate: new Date(t.dueDate),
        createdAt: new Date(t.createdAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      }));

      // Optionally, store them in local state
      setTasks((prev) => {
        // Avoid duplicates or old tasks
        const otherTasks = prev.filter((task) => task.memberId !== memberId);
        return [...otherTasks, ...fetchedTasks];
      });

      return fetchedTasks;
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("An error occurred while fetching tasks");
      return [];
    }
  };

  const getUserMembers = (userId: string) => {
    // Admin can see all members
    if (user?.role === "admin") {
      return members;
    }
    // Regular members only see their own added members
    return members.filter((member) => member.userId === userId);
  };

  const canManageTask = (taskId: string): boolean => {
    if (!user) return false;

    // Admin can manage all tasks
    if (user.role === "admin") return true;

    // Member can only manage their own tasks
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const member = members.find((m) => m.id === task.memberId);
    return member?.email === user.email;
  };

  return (
    <MemberContext.Provider
      value={{
        members,
        tasks,
        addMember,
        addTask,
        updateTask,
        deleteTask,
        getMemberTasks,
        getUserMembers,
        canManageTask,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
};

export const useMembers = () => {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error("useMembers must be used within a MemberProvider");
  }
  return context;
};
