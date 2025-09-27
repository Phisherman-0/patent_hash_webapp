import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logoutUser, fetchUser } from "@/store/authSlice";
import { authAPI, dashboardAPI, consultantAPI } from "@/lib/apiService";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Key,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Camera,
  Save,
  Trash2,
  Upload,
  X,
  Briefcase,
} from "lucide-react";
import z from "zod";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user, isInitialized, isLoading } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Consultant profile state
  const [isConsultantLoading, setIsConsultantLoading] = useState(false);
  const [isConsultantSaving, setIsConsultantSaving] = useState(false);
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardAPI.getStats,
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  // Fetch consultant profile data when user is a consultant
  useEffect(() => {
    const fetchConsultantProfile = async () => {
      if (user?.role === 'consultant') {
        try {
          setIsConsultantLoading(true);
          const response = await consultantAPI.getConsultantProfile();
          setSpecialization(response.specialization || "");
          setBio(response.bio || "");
          setExperienceYears(response.experienceYears || 0);
          setHourlyRate(response.hourlyRate || 0);
          if (response.availability) {
            setAvailabilityStatus(response.availability.status || 'available');
            setAvailabilityMessage(response.availability.message || "");
          }
        } catch (error) {
          console.log("Consultant profile not found, will create new one");
        } finally {
          setIsConsultantLoading(false);
        }
      }
    };

    fetchConsultantProfile();
  }, [user?.role]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      return authAPI.updateProfile(data);
    },
    onSuccess: (updatedUser) => {
      // Update the user in Redux store
      dispatch(fetchUser());
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        dispatch(logoutUser());
        return;
      }
      toast({
        title: "Error updating profile",
        description: error?.response?.data?.message || error?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      return authAPI.uploadProfileImage(file);
    },
    onSuccess: (response) => {
      dispatch(fetchUser());
      toast({
        title: "Profile image updated",
        description: "Your profile image has been successfully updated.",
      });
      setIsUploadingImage(false);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        dispatch(logoutUser());
        return;
      }
      toast({
        title: "Error uploading image",
        description: error?.message || "Failed to upload profile image",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async () => {
      return authAPI.deleteProfileImage();
    },
    onSuccess: () => {
      dispatch(fetchUser());
      toast({
        title: "Profile image deleted",
        description: "Your profile image has been successfully removed.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        dispatch(logoutUser());
        return;
      }
      toast({
        title: "Error deleting image",
        description: error?.message || "Failed to delete profile image",
        variant: "destructive",
      });
    },
  });

  const updateConsultantProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return consultantAPI.updateConsultantProfile(data);
    },
    onSuccess: () => {
      toast({
        title: "Consultant profile updated",
        description: "Your consultant profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        dispatch(logoutUser());
        return;
      }
      toast({
        title: "Error updating consultant profile",
        description: error?.response?.data?.message || error?.message || "Failed to update consultant profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploadingImage(true);
      uploadImageMutation.mutate(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = () => {
    deleteImageMutation.mutate();
  };

  const handleSaveConsultantProfile = () => {
    const consultantData = {
      specialization,
      bio,
      experienceYears,
      hourlyRate,
      availability: {
        status: availabilityStatus,
        message: availabilityMessage,
      },
    };
    updateConsultantProfileMutation.mutate(consultantData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-muted rounded animate-pulse"></div>
          <div className="lg:col-span-2 h-64 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                      src={user?.profileImageUrl ? `${import.meta.env.VITE_API_BASE_URL}${user.profileImageUrl}` : ""} 
                      alt={user?.firstName || ""} 
                    />
                    <AvatarFallback className="bg-primary text-white text-2xl font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 rounded-full p-0"
                      onClick={triggerImageUpload}
                      disabled={isUploadingImage || uploadImageMutation.isPending}
                    >
                      {isUploadingImage || uploadImageMutation.isPending ? (
                        <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={14} />
                      )}
                    </Button>
                    {user?.profileImageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 rounded-full p-0 text-red-600 hover:text-red-700"
                        onClick={handleDeleteImage}
                        disabled={deleteImageMutation.isPending}
                      >
                        {deleteImageMutation.isPending ? (
                          <div className="w-3 h-3 border border-red-300 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <CardTitle>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || "User"}
              </CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Shield className="mr-1" size={12} />
                  Verified
                </Badge>
                <Badge variant="secondary">
                  {user?.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last updated</span>
                  <span className="font-medium">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2" size={20} />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="text-muted-foreground" size={16} />
                  <span className="text-sm text-muted-foreground">Patents</span>
                </div>
                <span className="font-medium">{userStats?.totalPatents || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="text-muted-foreground" size={16} />
                  <span className="text-sm text-muted-foreground">Blockchain Secured</span>
                </div>
                <span className="font-medium">{userStats?.blockchainSecured || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="text-muted-foreground" size={16} />
                  <span className="text-sm text-muted-foreground">Portfolio Value</span>
                </div>
                <span className="font-medium">${userStats?.portfolioValue?.toLocaleString() || '0'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2" size={20} />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email address" 
                            {...field}
                            disabled
                          />
                        </FormControl>
                        <FormDescription>
                          Email cannot be changed. Contact support if you need to update this.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => form.reset()}
                    >
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="bg-primary hover:bg-primary-dark"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Settings className="mr-2 animate-spin" size={16} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2" size={16} />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Consultant Profile Section - Only show for consultants */}
          {user?.role === 'consultant' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2" size={20} />
                  Consultant Profile
                </CardTitle>
                <CardDescription>
                  Manage your consultant profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isConsultantLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2">Loading consultant profile...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(Number(e.target.value))}
                          min="0"
                        />
                      </div>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="rate">Hourly Rate ($)</Label>
                      <Input
                        id="rate"
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
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
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveConsultantProfile} 
                        disabled={updateConsultantProfileMutation.isPending || isConsultantSaving}
                        className="bg-primary hover:bg-primary-dark"
                      >
                        {updateConsultantProfileMutation.isPending || isConsultantSaving ? (
                          <>
                            <Settings className="mr-2 animate-spin" size={16} />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2" size={16} />
                            Save Consultant Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          </div>
                  
        </div>
      </div>
  );
}
