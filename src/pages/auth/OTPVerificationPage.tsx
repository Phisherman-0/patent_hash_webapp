import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppDispatch";
import { apiService } from "@/lib/apiService";
import { fetchUser } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const emailParam = searchParams.get("email");
  const email = user?.email || emailParam; // Priority to logged in user, then param

  // Redirect if no user or already verified
  // Redirect if no user or already verified
  useEffect(() => {
    if (!email) {
      navigate("/login");
    } else if (user?.isEmailVerified) {
      navigate("/");
    }
  }, [user, email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const dispatch = useAppDispatch();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!email) throw new Error("User email not found");

      await apiService.auth.verifyOTP({
        email: email,
        otp,
      });

      // Update user state to reflect verification
      await dispatch(fetchUser()).unwrap();

      // Redirect to dashboard
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!email) throw new Error("User email not found");

      await apiService.auth.resendOTP({
        email: email,
      });

      setCountdown(300);
      setCanResend(false);
      setOtp("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            <CardTitle className="text-xl">Verify your email</CardTitle>
            <CardDescription>
              We sent a verification code to <br />
              <span className="font-semibold">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  pattern={REGEXP_ONLY_DIGITS}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                <div className="text-center text-sm text-muted-foreground">
                  {countdown > 0 ? (
                    <p>Code expires in {formatTime(countdown)}</p>
                  ) : (
                    <p className="text-destructive">Code expired</p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center text-sm">
                Didn&apos;t receive the code?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={handleResend}
                  disabled={!canResend || isLoading}
                >
                  Resend
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
