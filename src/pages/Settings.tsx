import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { clearUser, fetchUser, UserSettings } from "@/store/authSlice";
import { isUnauthorizedError } from "@/lib/authUtils";
import { authAPI } from "@/lib/apiService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, Bell, Palette, Key, CheckCircle } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Settings() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user, isInitialized, isLoading } = useAppSelector((state) => state.auth);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        dispatch(clearUser());
      }, 500);
      return;
    }
  }, [user, isInitialized, isLoading, toast, dispatch]);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  // Update form when user data changes
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
    mutationFn: async (data: ProfileForm) => {
      return authAPI.updateProfile(data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      // Refresh user data in Redux store by calling the auth endpoint
      dispatch(fetchUser());
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          dispatch(clearUser());
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  // Define default settings
  const defaultSettings: UserSettings = {
    notifications: {
      emailUpdates: true,
      patentAlerts: true,
      systemNotifications: false,
      marketingEmails: false,
    },
    privacy: {
      profileVisibility: "private",
      dataSharing: false,
      analyticsOptIn: true,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
    },
    preferences: {
      theme: "system",
      language: "en",
      timezone: "UTC",
      currency: "USD",
    },
  };

  // Initialize settings with default values and merge with user settings
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load settings when component mounts or user changes
  useEffect(() => {
    if (user?.settings) {
      try {
        // Deep merge user settings with defaults
        const mergedSettings: UserSettings = {
          ...defaultSettings,
          ...user.settings,
          notifications: {
            ...defaultSettings.notifications,
            ...user.settings.notifications,
          },
          privacy: {
            ...defaultSettings.privacy,
            ...user.settings.privacy,
          },
          security: {
            ...defaultSettings.security,
            ...user.settings.security,
          },
          preferences: {
            ...defaultSettings.preferences,
            ...user.settings.preferences,
          },
        };
        setSettings(mergedSettings);
      } catch (error) {
        console.error('Error parsing user settings:', error);
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
  }, [user]);

  // Helper function to safely access settings with type safety
  const getSetting = <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
    category: T,
    key: K,
    defaultValue: UserSettings[T][K]
  ): UserSettings[T][K] => {
    const categorySettings = settings[category];
    if (categorySettings && key in categorySettings) {
      return categorySettings[key] as UserSettings[T][K];
    }
    return defaultValue;
  };

  const updateSetting = async <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
    category: T,
    key: K,
    value: UserSettings[T][K]
  ) => {
    const categorySettings = settings[category] || {};
    const newSettings = {
      ...settings,
      [category]: {
        ...categorySettings,
        [key]: value
      }
    };
    
    setSettings(newSettings);
    
    try {
      await authAPI.updateSettings(newSettings);
      
      // Refresh user data to get updated settings
      await dispatch(fetchUser()).unwrap();
      
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings, preferences, and security options
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
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
                          <Input placeholder="Enter your email address" {...field} />
                        </FormControl>
                        <FormDescription>
                          This email will be used for account notifications and patent updates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-semibold">Account Information</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">User ID</p>
                        <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Account Type</p>
                        <Badge variant="default">
                          {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Member Since</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Patent Status Updates</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified when your patent applications change status
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'patentAlerts', true)}
                        onCheckedChange={(checked) => 
                          updateSetting('notifications', 'patentAlerts', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">System Updates</p>
                        <p className="text-xs text-muted-foreground">
                          Important platform updates and maintenance notifications
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'systemNotifications', false)}
                        onCheckedChange={(checked) => 
                          updateSetting('notifications', 'systemNotifications', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Marketing Emails</p>
                        <p className="text-xs text-muted-foreground">
                          Product updates, tips, and promotional content
                        </p>
                      </div>
                      <Switch
                        checked={getSetting('notifications', 'marketingEmails', false)}
                        onCheckedChange={(checked) => 
                          updateSetting('notifications', 'marketingEmails', checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control how your data is used and shared
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Profile Visibility</p>
                    <Select 
                      value={getSetting('privacy', 'profileVisibility', 'private')}
                      onValueChange={(value) => updateSetting('privacy', 'profileVisibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="contacts">Contacts Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Control who can view your profile information
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Data Sharing</p>
                      <p className="text-xs text-muted-foreground">
                        Allow sharing anonymized usage data for platform improvement
                      </p>
                    </div>
                    <Switch
                      checked={getSetting('privacy', 'dataSharing', false)}
                      onCheckedChange={(checked) => 
                        updateSetting('privacy', 'dataSharing', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">
                        Help improve our services with usage analytics
                      </p>
                    </div>
                    <Switch
                      checked={getSetting('privacy', 'analyticsOptIn', true)}
                      onCheckedChange={(checked) => 
                        updateSetting('privacy', 'analyticsOptIn', checked)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your privacy is important to us. We never sell your personal data and only use it to provide better services. 
                    All patent data is encrypted and securely stored on blockchain networks.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSetting('security', 'twoFactorEnabled', false) ? "default" : "secondary"}>
                      {getSetting('security', 'twoFactorEnabled', false) ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSetting('security', 'twoFactorEnabled', !getSetting('security', 'twoFactorEnabled', false))}
                    >
                      {getSetting('security', 'twoFactorEnabled', false) ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Session Timeout</p>
                  <Select 
                    value={getSetting('security', 'sessionTimeout', 30).toString()}
                    onValueChange={(value) => updateSetting('security', 'sessionTimeout', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Automatically sign out after period of inactivity
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Login Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified when someone signs into your account
                    </p>
                  </div>
                  <Switch
                    checked={getSetting('security', 'loginNotifications', true)}
                    onCheckedChange={(checked) => 
                      updateSetting('security', 'loginNotifications', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Account Actions</h4>
                  <div className="flex gap-3">
                    <Button variant="outline">
                      Change Password
                    </Button>
                    <Button variant="outline">
                      Download Data
                    </Button>
                    <Button variant="destructive" disabled>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Application Preferences
              </CardTitle>
              <CardDescription>
                Customize your experience with theme, language, and display options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Theme</p>
                    <Select 
                      value={getSetting('preferences', 'theme', 'system')}
                      onValueChange={(value) => updateSetting('preferences', 'theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Language</p>
                    <Select 
                      value={getSetting('preferences', 'language', 'en')}
                      onValueChange={(value) => updateSetting('preferences', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Timezone</p>
                    <Select 
                      value={getSetting('preferences', 'timezone', 'UTC')}
                      onValueChange={(value) => updateSetting('preferences', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Currency</p>
                    <Select 
                      value={getSetting('preferences', 'currency', 'USD')}
                      onValueChange={(value) => updateSetting('preferences', 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Preference changes are saved automatically and will take effect immediately or on your next session.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}