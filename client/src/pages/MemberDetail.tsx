import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMembers } from "@/contexts/MemberContext";
import { Skeleton } from "@/components/ui/skeleton";
import type {  Task, TaskStatus, TaskPriority } from "@/contexts/MemberContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, PlusCircle, Edit, Trash2, Calendar, AlertCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/theme-provider";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const statusColors = {
  "todo": "bg-secondary text-secondary-foreground",
  "in-progress": "bg-amber-500 text-white",
  "review": "bg-blue-500 text-white",
  "completed": "bg-accent text-accent-foreground"
};

const statusLabels = {
  "todo": "To Do",
  "in-progress": "In Progress",
  "review": "Review",
  "completed": "Completed"
};

const priorityColors = {
  "low": "bg-slate-500 text-white",
  "medium": "bg-blue-500 text-white",
  "high": "bg-orange-500 text-white",
  "urgent": "bg-red-500 text-white"
};

const priorityLabels = {
  "low": "Low",
  "medium": "Medium",
  "high": "High",
  "urgent": "Urgent"
};

const MemberDetail = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { members, getMemberTasks, fetchMemberTasks, addTask, updateTask, deleteTask, membersLoading, isMemberTasksLoading } = useMembers();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  const member = members.find(m => m.id === memberId);
  const tasks = memberId ? getMemberTasks(memberId) : [];

  const loadingTasks = memberId ? isMemberTasksLoading(memberId) : false;

  const tasksByStatus = {
    "todo": tasks.filter(task => task.status === "todo"),
    "in-progress": tasks.filter(task => task.status === "in-progress"),
    "review": tasks.filter(task => task.status === "review"),
    "completed": tasks.filter(task => task.status === "completed"),
  };

  useEffect(() => {
    if (!isAddDialogOpen && !isEditDialogOpen) {
      resetForm();
    }
  }, [isAddDialogOpen, isEditDialogOpen]);

  useEffect(() => {
    if (user && member && member.userId !== user.id) {
      navigate("/dashboard");
    }
  }, [user, member, navigate]);

  // When we open this member page, ensure we have the latest tasks from server
  useEffect(() => {
    if (!memberId) return;
    // fire-and-forget fetch; state update in context will re-render component
    fetchMemberTasks(memberId).catch((err) => {
      // swallow - error is already logged in context
      console.error("Failed to load tasks for member", err);
    });
  }, [memberId, fetchMemberTasks]);

  const resetForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskDueDate(format(new Date(), "yyyy-MM-dd"));
    setCurrentTaskId(null);
  };

  const handleAddTask = () => {
    if (!memberId) return;
    
    addTask({
      title: taskTitle,
      description: taskDescription,
      status: taskStatus,
      priority: taskPriority,
      dueDate: new Date(taskDueDate),
      memberId,
    });
    
    setIsAddDialogOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(format(new Date(task.dueDate), "yyyy-MM-dd"));
    setCurrentTaskId(task.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (!currentTaskId) return;
    
    updateTask(currentTaskId, {
      title: taskTitle,
      description: taskDescription,
      status: taskStatus,
      priority: taskPriority,
      dueDate: new Date(taskDueDate),
    });
    
    setIsEditDialogOpen(false);
  };

  const confirmDeleteTask = (taskId: string) => {
    setCurrentTaskId(taskId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTask = () => {
    if (!currentTaskId) return;
    
    deleteTask(currentTaskId);
    setIsDeleteDialogOpen(false);
    setCurrentTaskId(null);
  };

  const getDueDateLabel = (dueDate: Date) => {
    if (isToday(dueDate)) return "Today";
    if (isTomorrow(dueDate)) return "Tomorrow";
    return format(dueDate, "MMM dd, yyyy");
  };

  if (!member) {
    if (membersLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6">
          <div className="w-[60%] max-w-2xl">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="w-[90%] max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-24" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Member not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            className="mb-2 pl-1" 
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <p className="text-muted-foreground">{member.role} • {member.email}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add new task</DialogTitle>
                    <DialogDescription>
                      Assign a new task to {member.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Task Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter task title"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the task"
                        className="min-h-[100px]"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Status is intentionally omitted on creation — new tasks are created as 'todo' by default */}
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={taskPriority} 
                          onValueChange={(value) => setTaskPriority(value as TaskPriority)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTask} disabled={!taskTitle}>
                      Add Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">To Do</h2>
              <Badge variant="outline" className="ml-2">
                {tasksByStatus["todo"].length}
              </Badge>
            </div>
            <div className="space-y-3">
              {tasksByStatus["todo"].map((task) => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  onEdit={() => handleEditTask(task)}
                  onDelete={() => confirmDeleteTask(task.id)}
                  getDueDateLabel={getDueDateLabel}
                />
              ))}
              {tasksByStatus["todo"].length === 0 && (
                <EmptyState status="todo" onAddTask={() => setIsAddDialogOpen(true)} />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">In Progress</h2>
              <Badge variant="outline" className="ml-2">
                {loadingTasks ? <Skeleton className="h-4 w-6 inline-block" /> : tasksByStatus["in-progress"].length}
              </Badge>
            </div>
            <div className="space-y-3">
              {loadingTasks ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <Card key={idx} className="shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <Skeleton className="h-3 w-full mb-3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  {tasksByStatus["in-progress"].map((task) => (
                    <TaskCard 
                      key={task.id}
                      task={task}
                      onEdit={() => handleEditTask(task)}
                      onDelete={() => confirmDeleteTask(task.id)}
                      getDueDateLabel={getDueDateLabel}
                    />
                  ))}
                  {tasksByStatus["in-progress"].length === 0 && (
                    <EmptyState status="in-progress" onAddTask={() => setIsAddDialogOpen(true)} />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">Review</h2>
              <Badge variant="outline" className="ml-2">
                {loadingTasks ? <Skeleton className="h-4 w-6 inline-block" /> : tasksByStatus["review"].length}
              </Badge>
            </div>
            <div className="space-y-3">
              {loadingTasks ? (
                Array.from({ length: 1 }).map((_, idx) => (
                  <Card key={idx} className="shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <Skeleton className="h-3 w-full mb-3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  {tasksByStatus["review"].map((task) => (
                    <TaskCard 
                      key={task.id}
                      task={task}
                      onEdit={() => handleEditTask(task)}
                      onDelete={() => confirmDeleteTask(task.id)}
                      getDueDateLabel={getDueDateLabel}
                    />
                  ))}
                  {tasksByStatus["review"].length === 0 && (
                    <EmptyState status="review" onAddTask={() => setIsAddDialogOpen(true)} />
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">Completed</h2>
              <Badge variant="outline" className="ml-2">
                {loadingTasks ? <Skeleton className="h-4 w-6 inline-block" /> : tasksByStatus["completed"].length}
              </Badge>
            </div>
            <div className="space-y-3">
              {loadingTasks ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <Card key={idx} className="shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <Skeleton className="h-3 w-full mb-3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  {tasksByStatus["completed"].map((task) => (
                    <TaskCard 
                      key={task.id}
                      task={task}
                      onEdit={() => handleEditTask(task)}
                      onDelete={() => confirmDeleteTask(task.id)}
                      getDueDateLabel={getDueDateLabel}
                    />
                  ))}
                  {tasksByStatus["completed"].length === 0 && (
                    <EmptyState status="completed" onAddTask={() => setIsAddDialogOpen(true)} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the task"
                className="min-h-[100px]"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={taskStatus} 
                  onValueChange={(value) => setTaskStatus(value as TaskStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select 
                  value={taskPriority} 
                  onValueChange={(value) => setTaskPriority(value as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask} disabled={!taskTitle}>
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const TaskCard = ({ task, onEdit, onDelete, getDueDateLabel }: { 
  task: Task; 
  onEdit: () => void; 
  onDelete: () => void;
  getDueDateLabel: (date: Date) => string;
}) => {
  const isOverdue = isPast(new Date(task.dueDate)) && task.status !== "completed";
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4 flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base font-medium pr-2">{task.title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex shrink-0">
              <span className="sr-only">Open menu</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge className={statusColors[task.status]}>
              {statusLabels[task.status]}
            </Badge>
            <Badge className={priorityColors[task.priority]}>
              {priorityLabels[task.priority]}
            </Badge>
          </div>
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            {getDueDateLabel(new Date(task.dueDate))}
            {isOverdue && " (Overdue)"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ status, onAddTask }: { status: TaskStatus; onAddTask: () => void }) => {
  return (
    <div className="border border-dashed border-muted-foreground/20 rounded-lg p-4 text-center">
      <p className="text-muted-foreground text-sm mb-2">No tasks in {statusLabels[status]}</p>
      {/* Only allow creating tasks from the To Do column */}
      {status === "todo" && (
        <Button variant="outline" size="sm" onClick={onAddTask}>
          Add Task
        </Button>
      )}
    </div>
  );
};

export default MemberDetail;
