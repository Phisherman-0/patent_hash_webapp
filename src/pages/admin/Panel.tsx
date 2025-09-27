import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  userId: string;
  consultantId: string;
  title: string;
  description?: string;
  appointmentDate: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface Consultant {
  id: string;
  userId: string;
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  rating?: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchAppointments();
    fetchConsultants();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.admin.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await apiService.admin.getAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    }
  };

  const fetchConsultants = async () => {
    try {
      const response = await apiService.consultants.getConsultants();
      setConsultants(response.data);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch consultants",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async () => {
    if (!editingUser || !newRole) return;

    try {
      const response = await apiService.admin.updateUserRole(editingUser.id, newRole);
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === editingUser.id ? response.data : u));
      
      // Reset editing state
      setEditingUser(null);
      setNewRole("");
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await apiService.admin.deleteUser(userId);
      
      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const verifyConsultant = async (consultantId: string, notes?: string) => {
    try {
      const response = await apiService.consultants.verifyConsultant(consultantId, notes);
      
      // Update local state
      setConsultants(prev => prev.map(c => c.id === consultantId ? response.data : c));
      
      toast({
        title: "Success",
        description: "Consultant verified successfully",
      });
    } catch (error) {
      console.error("Error verifying consultant:", error);
      toast({
        title: "Error",
        description: "Failed to verify consultant",
        variant: "destructive",
      });
    }
  };

  const rejectConsultant = async (consultantId: string, notes?: string) => {
    try {
      if (!notes) {
        toast({
          title: "Error",
          description: "Rejection notes are required",
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiService.consultants.rejectConsultant(consultantId, notes);
      
      // Update local state
      setConsultants(prev => prev.map(c => c.id === consultantId ? response.data : c));
      
      toast({
        title: "Success",
        description: "Consultant application rejected",
      });
    } catch (error) {
      console.error("Error rejecting consultant:", error);
      toast({
        title: "Error",
        description: "Failed to reject consultant",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'consultant':
        return <Badge variant="secondary">Consultant</Badge>;
      case 'user':
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return <Badge variant="default">Verified</Badge>;
    } else {
      return <Badge variant="destructive">Unverified</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'consultant').length}
                </p>
                <p className="text-sm text-muted-foreground">Consultants</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{appointments.length}</p>
                <p className="text-sm text-muted-foreground">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consultant Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {consultants.filter(c => c.isVerified).length}
                </p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {consultants.filter(c => !c.isVerified).length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {consultants.reduce((sum, c) => sum + (c.rating || 0), 0).toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>
              Manage user accounts and roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((userItem) => (
                <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{userItem.firstName} {userItem.lastName}</h3>
                      {getRoleBadge(userItem.role)}
                    </div>
                    <p className="text-sm text-muted-foreground">{userItem.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingUser(userItem);
                            setNewRole(userItem.role);
                          }}
                        >
                          Edit Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">{userItem.firstName} {userItem.lastName}</p>
                            <p className="text-sm text-muted-foreground">{userItem.email}</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="consultant">Consultant</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingUser(null);
                                setNewRole("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={updateUserRole}>Save</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteUser(userItem.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consultants Management */}
        <Card>
          <CardHeader>
            <CardTitle>Consultants Management</CardTitle>
            <CardDescription>
              Manage consultant applications and verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consultants.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No consultants found</p>
              ) : (
                consultants.map((consultant) => (
                  <div key={consultant.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {users.find(u => u.id === consultant.userId)?.firstName}{' '}
                            {users.find(u => u.id === consultant.userId)?.lastName}
                          </h3>
                          {getVerificationBadge(consultant.isVerified)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {users.find(u => u.id === consultant.userId)?.email}
                        </p>
                        {consultant.specialization && (
                          <p className="text-sm">
                            <span className="font-medium">Specialization:</span> {consultant.specialization}
                          </p>
                        )}
                        {consultant.experienceYears !== undefined && consultant.experienceYears > 0 && (
                          <p className="text-sm">
                            <span className="font-medium">Experience:</span> {consultant.experienceYears} years
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {consultant.isVerified ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Reset verification status
                              rejectConsultant(consultant.id, "Verification reset by admin");
                            }}
                          >
                            Reset Verification
                          </Button>
                        ) : (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="default" size="sm">
                                  Verify
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Verify Consultant</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>
                                    Are you sure you want to verify this consultant application?
                                  </p>
                                  <div className="space-y-2">
                                    <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
                                    <Textarea 
                                      id="verification-notes" 
                                      placeholder="Add any notes about this verification..."
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline"
                                      >
                                        Cancel
                                      </Button>
                                    </DialogTrigger>
                                    <Button 
                                      onClick={(e) => {
                                        const notesElement = document.getElementById('verification-notes') as HTMLTextAreaElement;
                                        if (notesElement) {
                                          verifyConsultant(consultant.id, notesElement.value || undefined);
                                        } else {
                                          verifyConsultant(consultant.id);
                                        }
                                      }}
                                    >
                                      Verify
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Consultant Application</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>
                                    Are you sure you want to reject this consultant application?
                                  </p>
                                  <div className="space-y-2">
                                    <Label htmlFor="rejection-notes">Rejection Notes (Required)</Label>
                                    <Textarea 
                                      id="rejection-notes" 
                                      placeholder="Reason for rejection..."
                                      required
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline"
                                      >
                                        Cancel
                                      </Button>
                                    </DialogTrigger>
                                    <Button 
                                      variant="destructive"
                                      onClick={(e) => {
                                        const notesElement = document.getElementById('rejection-notes') as HTMLTextAreaElement;
                                        if (notesElement && notesElement.value.trim()) {
                                          rejectConsultant(consultant.id, notesElement.value.trim());
                                        }
                                      }}
                                    >
                                      Reject Application
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </div>
                    {consultant.verificationNotes && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p className="text-sm">
                          <span className="font-medium">Notes:</span> {consultant.verificationNotes}
                        </p>
                        {consultant.verifiedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Verified on {new Date(consultant.verifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointments Management */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments Management</CardTitle>
            <CardDescription>
              View and manage all appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No appointments found</p>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{appointment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          User: {users.find(u => u.id === appointment.userId)?.firstName}{' '}
                          {users.find(u => u.id === appointment.userId)?.lastName} • 
                          Consultant: {users.find(u => u.id === appointment.consultantId)?.firstName}{' '}
                          {users.find(u => u.id === appointment.consultantId)?.lastName}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="mt-2 text-sm">
                      <p>Date: {new Date(appointment.appointmentDate).toLocaleString()}</p>
                      <p>Duration: {appointment.duration} minutes</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}