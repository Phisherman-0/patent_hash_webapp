import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, User } from "lucide-react";
import { format } from "date-fns";

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
  availability?: {
    status: 'available' | 'busy' | 'offline';
    message?: string;
  };
  rating?: number;
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function BrowseConsultantsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [filteredConsultants, setFilteredConsultants] = useState<Consultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [duration, setDuration] = useState(30);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    // Filter consultants based on search term
    if (!searchTerm) {
      setFilteredConsultants(consultants);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredConsultants(
        consultants.filter(
          (consultant) =>
            (consultant.specialization && consultant.specialization.toLowerCase().includes(term)) ||
            (consultant.bio && consultant.bio.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, consultants]);

  const fetchConsultants = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.consultants.getConsultants();
      setConsultants(response);
      setFilteredConsultants(response);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch consultants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      
      await apiService.appointments.bookAppointment(appointmentData);
      
      // Reset form
      setTitle("");
      setDescription("");
      setAppointmentDate("");
      setDuration(30);
      setSelectedConsultant(null);
      setIsBookingModalOpen(false);
      
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

  const openBookingModal = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setIsBookingModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading consultants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Browse Consultants</h1>
          <p className="text-muted-foreground">Find the right expert for your patent needs</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by specialization or expertise..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredConsultants.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "No consultants found matching your search" : "No consultants available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConsultants.map((consultant) => (
            <Card key={consultant.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>
                  Consultant
                </CardTitle>
                {consultant.specialization && (
                  <CardDescription>{consultant.specialization}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {consultant.bio && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {consultant.bio}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {consultant.availability && (
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        consultant.availability.status === 'available' ? 'bg-green-500' :
                        consultant.availability.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></span>
                      <span className="capitalize">{consultant.availability.status}</span>
                      {consultant.availability.message && (
                        <span className="ml-2 text-muted-foreground">- {consultant.availability.message}</span>
                      )}
                    </div>
                  )}
                  {consultant.experienceYears !== undefined && consultant.experienceYears > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience:</span>
                      <span>{consultant.experienceYears} years</span>
                    </div>
                  )}
                  
                  {consultant.hourlyRate !== undefined && consultant.hourlyRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate:</span>
                      <span>${consultant.hourlyRate}/hour</span>
                    </div>
                  )}
                  
                  {consultant.rating !== undefined && consultant.rating > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating:</span>
                      <span>★ {consultant.rating}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button className="w-full" onClick={() => openBookingModal(consultant)}>
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          {selectedConsultant && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {selectedConsultant.user 
                          ? `${selectedConsultant.user.firstName} ${selectedConsultant.user.lastName}`
                          : 'Consultant'}
                      </h3>
                      {selectedConsultant.specialization && (
                        <p className="text-sm text-muted-foreground">{selectedConsultant.specialization}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {selectedConsultant.hourlyRate && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Rate: </span>
                        <span className="font-medium">${selectedConsultant.hourlyRate}/hour</span>
                      </div>
                    )}
                    {selectedConsultant.experienceYears && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Experience: </span>
                        <span className="font-medium">{selectedConsultant.experienceYears} years</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
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

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsBookingModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBookAppointment} 
                    disabled={isBooking}
                  >
                    {isBooking ? "Booking..." : "Book Appointment"}
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