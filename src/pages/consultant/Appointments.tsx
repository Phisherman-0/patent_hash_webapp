import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Appointment {
  id: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
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

export default function ConsultantAppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.appointments.getConsultantAppointments();
      setAppointments(response);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled') => {
    try {
      setUpdatingStatus(appointmentId);
      
      const response = await apiService.appointments.updateAppointmentStatus(appointmentId, status);
      
      // Update local state
      setAppointments(prev => prev.map(app => 
        app.id === appointmentId ? { ...app, ...response } : app
      ));
      
      toast({
        title: "Success",
        description: `Appointment ${status} successfully`,
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">Manage your upcoming and past appointments</p>
        </div>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No appointments found</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{appointment.title}</CardTitle>
                    <CardDescription>
                      {appointment.user 
                        ? `with ${appointment.user.firstName} ${appointment.user.lastName}` 
                        : 'with User'} •{' '}
                      {format(new Date(appointment.appointmentDate), "MMMM d, yyyy 'at' h:mm a")} 
                      {' • '}
                      {appointment.duration} minutes
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {appointment.description && (
                  <p className="text-muted-foreground mb-4">{appointment.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {appointment.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                        disabled={updatingStatus === appointment.id}
                      >
                        {updatingStatus === appointment.id ? "Confirming..." : "Confirm"}
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        disabled={updatingStatus === appointment.id}
                      >
                        {updatingStatus === appointment.id ? "Cancelling..." : "Cancel"}
                      </Button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && appointment.meetingLink && (
                    <Button asChild>
                      <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Meeting
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}