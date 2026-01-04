import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { registerUser, clearError } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, User, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Link as WouterLink } from "wouter";
import { Progress } from "@/components/ui/progress";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["user", "consultant"]).default("user"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);
  const [, navigate] = useLocation();

  // Redirect to OTP verification if user is created but not verified
  useEffect(() => {
    if (user && !user.isEmailVerified) {
      navigate(`/verify-email?email=${encodeURIComponent(user.email)}`);
    } else if (user && user.isEmailVerified) {
      navigate("/");
    }
  }, [user, navigate]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    dispatch(clearError());
    const { confirmPassword, ...userData } = data;
    dispatch(registerUser(userData));
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["firstName", "lastName", "email"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["password", "confirmPassword"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const progress = (currentStep / 3) * 100;

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message="Creating your account..." />

      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">P</span>
            </div>
            <span className="text-xl font-bold">
              Patent <span className="text-orange-500">Hash</span>
            </span>
          </a>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create an account</CardTitle>
              <CardDescription>
                Step {currentStep} of 3: {
                  currentStep === 1 ? "Personal Information" :
                    currentStep === 2 ? "Security" :
                      "Account Type"
                }
              </CardDescription>
              <Progress value={progress} className="mt-2" />
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="John"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
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
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Doe"
                                    className="pl-10"
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
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="m@example.com"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="button" onClick={nextStep} className="w-full">
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Password */}
                  {currentStep === 2 && (
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password"
                                  className="pl-10 pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  className="pl-10 pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={prevStep} className="w-full">
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="button" onClick={nextStep} className="w-full">
                          Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Role Selection */}
                  {currentStep === 3 && (
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am a...</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-4">
                                <Button
                                  type="button"
                                  variant={field.value === "user" ? "default" : "outline"}
                                  className="h-24 flex-col"
                                  onClick={() => field.onChange("user")}
                                >
                                  <User className="h-6 w-6 mb-2" />
                                  <span>Patent Owner</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "consultant" ? "default" : "outline"}
                                  className="h-24 flex-col"
                                  onClick={() => field.onChange("consultant")}
                                >
                                  <User className="h-6 w-6 mb-2" />
                                  <span>Consultant</span>
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={prevStep} className="w-full">
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Creating Account...
                            </div>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>

              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <WouterLink href="/login">
                  <a className="underline underline-offset-4">Sign in</a>
                </WouterLink>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
