import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  User,
  Edit,
  Save,
  LogOut,
  Camera,
  Calendar,
  Clock,
  Activity,
  Bell,
  Heart,
} from "lucide-react";
import { BottomNavigation } from "./BottomNavigation";

const API_URL = "http://localhost:5000/api";

interface PatientProfileProps {
  user?: any;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

interface Stats {
  totalLogs: number;
  totalReports: number;
  daysTracked: number;
  averagePain: number;
}

export function PatientProfile({ user, onNavigate, onLogout }: PatientProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalLogs: 0,
    totalReports: 0,
    daysTracked: 0,
    averagePain: 0,
  });
  
  const [reminderSettings, setReminderSettings] = useState({
    appointmentReminders: true,
    emailReminders: false,
    smsReminders: true,
    medicationReminders: true,
    pushNotifications: true,
  });

  // ✅ Fetch profile
// ✅ Fetch profile
useEffect(() => {
  const fetchProfileAndStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // 🧍 Fetch profile
      const profileRes = await fetch(`${API_URL}/patient/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.success) {
        setProfileData(profileData.data);
      }

      // 📊 Fetch stats
      const statsRes = await fetch(`${API_URL}/patient/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();

      // 🧾 Fetch report count from Record model
      const reportsRes = await fetch(`${API_URL}/records/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reportsData = await reportsRes.json();

      if (statsRes.ok && statsData.success) {
        setStats((prev) => ({
          ...prev,
          ...statsData.data,
          totalReports: reportsData?.data?.totalReports || 0,
        }));
      }
    } catch (err) {
      console.error("Error fetching profile/stats/reports:", err);
    }
  };

  fetchProfileAndStats();
}, []);



  // ✅ Save profile updates
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        surgeryType: profileData.surgeryType,
        surgeryDate: profileData.surgeryDate,
        surgeon: profileData.surgeon,
        hospital: profileData.hospital,
        allergies: profileData.allergies,
        medications: profileData.medications,
        emergencyContact: profileData.emergencyContact,
      };

      const res = await fetch(`${API_URL}/patient/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Profile updated successfully!");
        setProfileData(data.data);
        setIsEditing(false);
      } else {
        alert("⚠️ Update failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("❌ Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Logout?")) {
      localStorage.removeItem("token");
      onLogout();
    }
  };

  const toggleReminder = (key: keyof typeof reminderSettings) => {
    setReminderSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading profile...
      </div>
    );
  }

  const daysSinceSurgery = profileData.surgeryDate
    ? Math.floor(
        (Date.now() - new Date(profileData.surgeryDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => onNavigate("patient-dashboard")} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <User className="w-6 h-6 text-blue-500" />
              <div>
                <h1 className="text-xl font-semibold">Profile</h1>
                <p className="text-sm text-gray-600">Manage your account settings</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="rounded-xl"
              disabled={loading}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save"}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.profileImage} alt={profileData.name} />
                  <AvatarFallback className="text-2xl">
                    {profileData.name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="text-center sm:text-left space-y-2">
                <h2 className="text-2xl">{profileData.name}</h2>
                <p className="text-gray-600">{profileData.email}</p>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Patient ID: P-{user?.id?.toUpperCase?.() || "N/A"}
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Day {daysSinceSurgery} Recovery
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Recovery Stats */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Recovery Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <p className="text-2xl text-blue-600">{stats.totalLogs}</p>
                <p className="text-sm text-gray-600">Log Entries</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-2xl">
                <p className="text-2xl text-green-600">{stats.totalReports}</p>
                <p className="text-sm text-gray-600">Reports Uploaded</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-2xl">
                <p className="text-2xl text-purple-600">{stats.daysTracked}</p>
                <p className="text-sm text-gray-600">Days Tracked</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-2xl">
                <p className="text-2xl text-orange-600">{stats.averagePain}</p>
                <p className="text-sm text-gray-600">Avg Pain Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["name", "email", "phone", "address"].map((field) => (
              <div key={field}>
                <Label>{field.replace(/([A-Z])/g, " $1")}</Label>
                <Input
                  value={profileData[field] || ""}
                  onChange={(e) =>
                    setProfileData((prev: any) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Surgery Info */}
        <Card className="rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-blue-500" />
              <span>Surgery Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["surgeryType", "surgeryDate", "surgeon", "hospital"].map(
              (field) => (
                <div key={field}>
                  <Label>{field.replace(/([A-Z])/g, " $1")}</Label>
                  <Input
                    value={profileData[field] || ""}
                    onChange={(e) =>
                      setProfileData((prev: any) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                  />
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Medical Info */}
        <Card className="rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["allergies", "medications", "emergencyContact"].map((field) => (
              <div key={field}>
                <Label>{field.replace(/([A-Z])/g, " $1")}</Label>
                <Input
                  value={profileData[field] || ""}
                  onChange={(e) =>
                    setProfileData((prev: any) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation
        activeTab="profile"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}
