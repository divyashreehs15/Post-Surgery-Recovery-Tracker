import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Stethoscope, User, Mail, Lock } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { apiLogin } from "../api/client"; 
import Pic from "../assets/Pic.jpeg"; 
import { getRole, getSession, saveSession } from "../api/sessions";


interface LoginScreenProps {
  onLogin: (userData: any, role: "patient" | "doctor") => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isDoctor, setIsDoctor] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Auto login if token already exists (unchanged)
useEffect(() => {
  const doctorSession = getSession("doctor");
  const patientSession = getSession("patient");

  if (doctorSession && patientSession) {
    // Let user choose (default to last active role)
    const role = getRole();
    setIsDoctor(role === "doctor");
    onLogin(
      role === "doctor" ? doctorSession.user : patientSession.user,
      role
    );
  } else if (doctorSession) {
    setIsDoctor(true);
    onLogin(doctorSession.user, "doctor");
  } else if (patientSession) {
    setIsDoctor(false);
    onLogin(patientSession.user, "patient");
  }
}, [onLogin]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Determine the role the user *intends* to log in as (from the toggle)
      const selectedRole: "patient" | "doctor" = isDoctor ? "doctor" : "patient";
      
      // 2. 🚨 THE FIX: Pass email, password, and the selected role to the API
      const resp = await apiLogin({ email, password, role: selectedRole });
      const { token, data } = resp;

      if (!token || !data) throw new Error("Invalid response from server or token is missing.");

      // 3. Determine the role from the backend data
      const actualRole: "patient" | "doctor" | undefined = data.role as "patient" | "doctor" | undefined;
      
      // 4. CRITICAL VALIDATION: Check for role mismatch (This is good practice)
      if (actualRole) {
          // If the server explicitly sent a role, it MUST match the selected role.
          if (actualRole !== selectedRole) {
              // BLOCK LOGIN and inform the user of the mismatch
              throw new Error(`Login Failed: This account is registered as a **${actualRole}**, not a ${selectedRole}. Please check the Doctor/Patient toggle.`);
          }
      } else {
          // Fallback: If the backend is missing the role, we must assume the user is logging in correctly.
          console.warn("API response is missing the 'role' field. Proceeding based on user selection.");
      }

      // 5. Save session (using the verified role or the selected role if validation was skipped)
      saveSession(selectedRole, token, data);

      // 6. Proceed to dashboard, passing the verified/selected role
      onLogin({ ...data, role: selectedRole }, selectedRole);

    } catch (err: any) {
      // Display the specific error message
      // Handle the server error shape if necessary, otherwise use the message from the thrown error
      // Note: The error message from the backend "Authentication failed. This account is registered as a..." will now be caught here.
      setError(err?.message || "Login failed. Check credentials and role toggle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8">
          <div className="w-full max-w-md">
            <ImageWithFallback
              src={Pic}
              alt="Healthcare illustration"
              className="w-full h-auto rounded-3xl shadow-lg"
            />
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-4xl text-gray-800">Synara</h1>
            <p className="text-lg text-gray-600 max-w-md">
              Your comprehensive post-surgery recovery companion. Track progress, connect with your healthcare team, and achieve better outcomes.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-0 rounded-3xl">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto">
                {isDoctor ? (
                  <Stethoscope className="w-8 h-8 text-primary" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription className="text-base">
                  Sign in to your **{isDoctor ? "doctor" : "patient"}** account
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Doctor Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                <Label
                  htmlFor="doctor-mode"
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Patient</span>
                </Label>
                <Switch
                  id="doctor-mode"
                  checked={isDoctor}
                  onCheckedChange={setIsDoctor}
                />
                <Label
                  htmlFor="doctor-mode"
                  className="flex items-center space-x-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor</span>
                </Label>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={
                        isDoctor
                          ? "doctor@hospital.com"
                          : "patient@email.com"
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  Don’t have an account?{" "}
                  <span className="text-primary font-medium">
                    Please contact your hospital administration.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Hero Text */}
          <div className="lg:hidden text-center space-y-4 mt-8">
            <h1 className="text-3xl text-gray-800">Synara</h1>
            <h1 className="text-3xl text-gray-800">Recovery Tracker</h1>
            <p className="text-gray-600 max-w-md">
              Your comprehensive post-surgery recovery companion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}