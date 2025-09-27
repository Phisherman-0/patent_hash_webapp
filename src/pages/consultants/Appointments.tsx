import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Calendar, 
  Clock, 
  User, 
  CalendarDays 
} from "lucide-react";

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
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  rating?: number;
}

export default function UserAppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  
  // Rescheduling state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState("");
  const [newDuration, setNewDuration] = useState(30);
  
  // Booking form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetchAppointments();
    fetchConsultants();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.appointments.getUserAppointments();
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

  const fetchConsultants = async () => {
    try {
      const response = await apiService.consultants.getConsultants();
      setConsultants(response);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch consultants",
        variant: "destructive",
      });
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedConsultant) {
      toast({
        title: "Error",
        description: "Please select a consultant",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBooking(true);
      
      const appointmentData = {
        consultantId: selectedConsultant.id,
        title,
        description,
        appointmentDate,
        duration
      };
      
      const response = await apiService.appointments.bookAppointment(appointmentData);
      
      // Add new appointment to local state
      setAppointments(prev => [response, ...prev]);
      
      // Reset form
      setTitle("");
      setDescription("");
      setAppointmentDate("");
      setDuration(30);
      setSelectedConsultant(null);
      
      toast({
        title: "Success",
        description: "Appointment booked successfully",
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Error",
        description: "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      await apiService.appointments.cancelAppointment(appointmentId);
      
      // Remove appointment from local state
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      
      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setNewAppointmentDate(appointment.appointmentDate);
    setNewDuration(appointment.duration);
    setIsRescheduling(true);
  };

  const handleReschedule = async () => {
    if (!appointmentToReschedule) return;

    try {
      // For rescheduling, we'll cancel the current appointment and create a new one
      // In a production app, you might want a dedicated reschedule endpoint
      await apiService.appointments.cancelAppointment(appointmentToReschedule.id);
      
      // Create new appointment with updated details
      const newAppointmentData = {
        consultantId: appointmentToReschedule.consultantId,
        title: appointmentToReschedule.title,
        description: appointmentToReschedule.description,
        appointmentDate: newAppointmentDate,
        duration: newDuration
      };
      
      const newAppointment = await apiService.appointments.bookAppointment(newAppointmentData);
      
      // Update local state
      setAppointments(prev => [
        newAppointment,
        ...prev.filter(app => app.id !== appointmentToReschedule.id)
      ]);
      
      // Close modal and reset state
      setIsRescheduling(false);
      setAppointmentToReschedule(null);
      setNewAppointmentDate("");
      setNewDuration(30);
      
      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      });
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment",
        variant: "destructive",
      });
    }
  };

  const startChatWithConsultant = async (consultantId: string) => {
    try {
      // Create or get existing chat room with the consultant
      const chatRoomData = {
        consultantId: consultantId
      };
      
      const chatRoom = await apiService.chat.createChatRoom(chatRoomData);
      
      // Navigate to the chat page with the chat room ID
      window.location.href = `/consultants/messages?room=${chatRoom.id}`;
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat with consultant",
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
          <p className="text-muted-foreground">View and manage your appointments with consultants</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Book New Appointment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Select Consultant</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {consultants.map((consultant) => (
                    <Card 
                      key={consultant.id}
                      className={`cursor-pointer ${selectedConsultant?.id === consultant.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedConsultant(consultant)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <h3 className="font-medium">
                            {consultants.find(c => c.id === consultant.id && c.userId) 
                              ? `${consultants.find(c => c.id === consultant.id)?.userId}` 
                              : 'Consultant'}
                          </h3>
                          {consultant.rating && (
                            <span className="text-sm text-muted-foreground">
                              ★ {consultant.rating}
                            </span>
                          )}
                        </div>
                        {consultant.specialization && (
                          <p className="text-sm text-muted-foreground">{consultant.specialization}</p>
                        )}
                        {consultant.hourlyRate && (
                          <p className="text-sm font-medium">${consultant.hourlyRate}/hour</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {selectedConsultant && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Appointment Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Patent filing consultation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe what you'd like to discuss"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date & Time</Label>
                      <Input
                        id="date"
                        type="datetime-local"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min="15"
                        step="15"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleBookAppointment} disabled={isBooking}>
                      {isBooking ? "Booking..." : "Book Appointment"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No appointments found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Book your first appointment with a consultant
              </p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const consultant = consultants.find(c => c.id === appointment.consultantId);
            return (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{appointment.title}</CardTitle>
                      <CardDescription>
                        {consultant 
                          ? `with ${consultant.user ? `${consultant.user.firstName} ${consultant.user.lastName}` : 'Consultant'}` 
                          : 'with Consultant'} •{' '}
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
                    {appointment.status === 'confirmed' && appointment.meetingLink && (
                      <Button asChild>
                        <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                          Join Meeting
                        </a>
                      </Button>
                    )}
                    
                    {appointment.status === 'pending' && (
                      <Button 
                        variant="destructive"
                        onClick={() => cancelAppointment(appointment.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <>
                        <Button 
                          variant="outline"
                          onClick={() => startChatWithConsultant(appointment.consultantId)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Chat
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => openRescheduleModal(appointment)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Reschedule
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Reschedule Modal */}
      <Dialog open={isRescheduling} onOpenChange={setIsRescheduling}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          {appointmentToReschedule && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium">{appointmentToReschedule.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(appointmentToReschedule.appointmentDate), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newDate">New Date & Time</Label>
                  <Input
                    id="newDate"
                    type="datetime-local"
                    value={newAppointmentDate}
                    onChange={(e) => setNewAppointmentDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newDuration">Duration (minutes)</Label>
                  <Input
                    id="newDuration"
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    min="15"
                    step="15"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRescheduling(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleReschedule}>
                    Reschedule
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}