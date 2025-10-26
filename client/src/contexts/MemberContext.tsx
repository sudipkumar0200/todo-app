import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "@/components/ui/sonner";

// API Configuration
const API_BASE_URL = "http://localhost:3001/api/v1"; // Update with your backend URL

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem("authToken");

// Types
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
  userId: string;
  createdAt: Date;
};

type MemberContextType = {
  members: Member[];
  tasks: Task[];
  membersLoading: boolean;
  isMemberTasksLoading: (memberId: string) => boolean;
  addMember: (member: Omit<Member, "id" | "createdAt">) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedAt">) => void;
  updateTask: (id: string, updatedTask: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getMemberTasks: (memberId: string) => Task[];
  fetchMemberTasks: (memberId: string) => Promise<void>;
  getUserMembers: (userId: string) => Member[];
};

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const MemberProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // track loading state for tasks per-member so UIs can show skeletons
  const [memberTasksLoading, setMemberTasksLoading] = useState<Record<string, boolean>>({});

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

  // Fetch tasks for a specific member from the API and merge into state
  const fetchMemberTasks = useCallback(async (memberId: string) => {
    const token = getAuthToken();
    if (!token) return;

    // mark this member as loading
    setMemberTasksLoading((prev) => ({ ...prev, [memberId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/members/${memberId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      const memberTasks: Task[] = data.tasks.map((t: any) => ({
        ...t,
        dueDate: new Date(t.dueDate),
        createdAt: new Date(t.createdAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      }));

      // Replace any existing tasks for this member with fresh ones from server
      setTasks((prev) => [
        ...prev.filter((task) => task.memberId !== memberId),
        ...memberTasks,
      ]);
    } catch (error) {
      console.error("Failed to fetch member tasks:", error);
    } finally {
      setMemberTasksLoading((prev) => ({ ...prev, [memberId]: false }));
    }
  }, []);


  const isMemberTasksLoading = (memberId: string) => !!memberTasksLoading[memberId];
  const addMember = async (member: Omit<Member, "id" | "createdAt">) => {
    
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
          "Authorization": `Bearer ${token}`,
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
      const response = await fetch(`${API_BASE_URL}/members/${task.memberId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        }),
      });

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
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    
    const token = getAuthToken();
    if (!token) {
      toast.error("You must be logged in");
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const response = await fetch(`${API_BASE_URL}/members/${task.memberId}/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTask),
      });

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
  };

  // Helper functions
  const getMemberTasks = (memberId: string) => {
    return tasks.filter((task) => task.memberId === memberId);
  };

  const getUserMembers = (userId: string) => {
    return members.filter((member) => member.userId === userId);
  };

  return (
    <MemberContext.Provider
      value={{
        members,
        tasks,
        membersLoading: isLoading,
        isMemberTasksLoading,
        addMember,
        addTask,
        updateTask,
        deleteTask,
        getMemberTasks,
        fetchMemberTasks,
        getUserMembers,
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
