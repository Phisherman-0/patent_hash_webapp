import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logoutUser, fetchUser } from "@/store/authSlice";
import { authAPI, dashboardAPI } from "@/lib/apiService";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2" size={20} />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Key className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="text-green-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Privacy Settings</h4>
                      <p className="text-sm text-muted-foreground">Control how your data is used and shared</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Data Export</h4>
                      <p className="text-sm text-muted-foreground">Download a copy of your patent data</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Trash2 className="mr-2" size={20} />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 className="font-medium text-red-900">Sign Out</h4>
                  <p className="text-sm text-red-700">Sign out of your account on this device</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <LogOut className="mr-2" size={14} />
                  Sign Out
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 className="font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="mr-2" size={14} />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
