import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ConsultantProfileData {
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  availability?: {
    status: 'available' | 'busy' | 'offline';
    message?: string;
  };
}

export default function ConsultantProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  useEffect(() => {
    fetchConsultantProfile();
  }, []);

  const fetchConsultantProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.auth.getCurrentUser();
      const userData = response.data;
      
      // Fetch consultant profile
      try {
        const profileResponse = await apiService.consultants.getConsultantProfile();
        setSpecialization(profileResponse.specialization || "");
        setBio(profileResponse.bio || "");
        setExperienceYears(profileResponse.experienceYears || 0);
        setHourlyRate(profileResponse.hourlyRate || 0);
        if (profileResponse.availability) {
          setAvailabilityStatus(profileResponse.availability.status || 'available');
          setAvailabilityMessage(profileResponse.availability.message || "");
        }
      } catch (profileError) {
        // If profile doesn't exist, we'll create one
        console.log("Consultant profile not found, will create new one");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const profileData = {
        specialization,
        bio,
        experienceYears,
        hourlyRate,
        availability: {
          status: availabilityStatus,
          message: availabilityMessage,
        },
      };
      
      await apiService.consultants.updateConsultantProfile(profileData);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Consultant Profile</h1>
          <p className="text-muted-foreground">Manage your consultant profile and settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your consultant profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Patent Law, Technical Writing, AI Patents"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your expertise and experience"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly Rate ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="availability">Availability Status</Label>
                <select
                  id="availability"
                  className="w-full p-2 border rounded"
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as 'available' | 'busy' | 'offline')}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="availabilityMessage">Availability Message (Optional)</Label>
                <Input
                  id="availabilityMessage"
                  value={availabilityMessage}
                  onChange={(e) => setAvailabilityMessage(e.target.value)}
                  placeholder="e.g., Available for new appointments, In a meeting, etc."
                />
              </div>
              
              <div className="pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
              <CardDescription>
                How your profile appears to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      availabilityStatus === 'available' ? 'bg-green-500' :
                      availabilityStatus === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></span>
                    <span className="capitalize">{availabilityStatus}</span>
                    {availabilityMessage && (
                      <span className="ml-2 text-muted-foreground">- {availabilityMessage}</span>
                    )}
                  </div>
                  {specialization && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Specialization:</span> {specialization}
                    </p>
                  )}
                  {experienceYears > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Experience:</span> {experienceYears} years
                    </p>
                  )}
                  {hourlyRate > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Rate:</span> ${hourlyRate}/hour
                    </p>
                  )}
                </div>
                
                {bio && (
                  <div>
                    <h4 className="font-medium mb-1">Bio</h4>
                    <p className="text-sm text-muted-foreground">{bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}