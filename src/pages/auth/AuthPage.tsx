import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { loginUser, registerUser, clearError } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);
  const [, navigate] = useLocation();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = async (data: LoginFormValues) => {
    console.log('Login form data:', data); // Debug log
    dispatch(clearError());
    dispatch(loginUser(data));
  };

  const onRegister = async (data: RegisterFormValues) => {
    console.log('Register form data:', data); // Debug log
    dispatch(clearError());
    const { confirmPassword, ...userData } = data;
    dispatch(registerUser(userData));
  };

  return (
    <>
      <LoadingOverlay 
        isVisible={isLoading} 
        message={activeTab === "login" ? "Signing you in..." : "Creating your account..."}
      />
      
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border border-gray-100">
            <CardHeader className="text-center pb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Patent <span className="text-orange-500">Hash</span>
              </h1>
              <CardDescription className="text-gray-600">
                Sign in to continue
              </CardDescription>
            </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-lg">
                    <TabsTrigger 
                      value="login" 
                      data-testid="tab-login"
                      className="rounded-md font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      data-testid="tab-register"
                      className="rounded-md font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login" className="space-y-6">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    data-testid="input-login-email"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type={showLoginPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    className="pl-10 pr-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    data-testid="input-login-password"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                  >
                                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg" 
                          disabled={isLoading}
                          data-testid="button-login"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Signing In...
                            </div>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Register Tab */}
                  <TabsContent value="register" className="space-y-6">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 font-medium">First Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                      placeholder="First name"
                                      className="pl-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      data-testid="input-register-firstname"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 font-medium">Last Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                      placeholder="Last name"
                                      className="pl-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      data-testid="input-register-lastname"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    data-testid="input-register-email"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type={showRegisterPassword ? "text" : "password"}
                                    placeholder="Create a password"
                                    className="pl-10 pr-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    data-testid="input-register-password"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                  >
                                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    className="pl-10 pr-10 h-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    data-testid="input-register-confirm-password"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg" 
                          disabled={isLoading}
                          data-testid="button-register"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating Account...
                            </div>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
