import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  Search,
  Users,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Activity,
  Thermometer,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { apiGetDoctorAssignments, apiGetUser } from "../api/client";
import { PatientDetailView } from "./PatientDetailView";

interface DoctorDashboardProps {
  user: any;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function DoctorDashboard({
  user,
  onNavigate,
  onLogout,
}: DoctorDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch assigned patients for logged-in doctor
// ✅ Fetch assigned patients for logged-in doctor
useEffect(() => {
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const doctorId = storedUser?._id || storedUser?.id;

      if (!doctorId) {
        console.error("⚠️ Doctor ID not found in localStorage.");
        setLoading(false);
        return;
      }

      // ✅ Call centralized API helper
      const data = await apiGetDoctorAssignments("my");
      console.log("📡 Doctor assignments fetched:", data);


      if (data.success && data.data?.patientIds?.length) {
const mappedPatients = data.data.patientIds.map((u: any) => {
  console.log("🧪 RAW PATIENT DATA:", u);
  console.log("➡ painLevel from API:", u.painLevel);
  console.log("➡ symptomScore (this should be risk):", u.recoveryHistory);
  
  return {
    id: u._id,
    name: u.name,
    age: u.age || "N/A",
    surgeryType: u.surgeryType || "Unknown",
    surgeryDate: u.surgeryDate || new Date().toISOString(),
    status: u.status || "stable",
    lastUpdate:
      u.lastUpdated
        ? new Date(u.lastUpdated).toLocaleDateString()
        : "N/A",

    // Values being tested:
    painLevel: u.painLevel ?? 0,
    risk: u.risk??0,
    mobility: u.mobility ?? 50,
    recentLogs: u.logEntries ?? 0,
    recoveryHistory: u.recoveryHistory || [],
  };
});


        setPatients(mappedPatients);
      } else {
        console.warn("⚠️ No assigned patients found for doctor");
        setPatients([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch doctor assignments:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  fetchAssignments();
}, []);

  // 🔍 Search + filter
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.surgeryType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "stable":
        return CheckCircle;
      case "moderate":
      case "critical":
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  const daysSinceSurgery = (surgeryDate: string) => {
    return Math.floor(
      (Date.now() - new Date(surgeryDate).getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  if (selectedPatient) {
    return (
      <PatientDetailView
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profileImage} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <h1 className="text-xl">Welcome, {user.name}</h1>
                <p className="text-sm text-gray-600">
                  Managing {filteredPatients.length} patients
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="rounded-xl"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              color: "bg-blue-100 text-blue-600",
              label: "Total Patients",
              value: patients.length,
            },
            {
              icon: AlertTriangle,
              color: "bg-red-100 text-red-600",
              label: "Critical",
              value: patients.filter((p) => p.status === "critical").length,
            },
            {
              icon: AlertTriangle,
              color: "bg-yellow-100 text-yellow-600",
              label: "Moderate",
              value: patients.filter((p) => p.status === "moderate").length,
            },
            {
              icon: CheckCircle,
              color: "bg-green-100 text-green-600",
              label: "Stable",
              value: patients.filter((p) => p.status === "stable").length,
            },
          ].map(({ icon: Icon, color, label, value }) => (
            <Card key={label} className="rounded-3xl border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div
                  className={`w-12 h-12 ${
                    color.split(" ")[0]
                  } rounded-2xl flex items-center justify-center mx-auto mb-3`}
                >
                  <Icon className={`w-6 h-6 ${color.split(" ")[1]}`} />
                </div>
                <p className="text-2xl text-gray-900">{value}</p>
                <p className="text-sm text-gray-600">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search patients by name or surgery type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "stable", "moderate", "critical"].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="rounded-xl capitalize"
                  >
                    {status === "all" ? "All Patients" : status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPatients.map((patient) => {
            const StatusIcon = getStatusIcon(patient.status);
            const days = daysSinceSurgery(patient.surgeryDate);

            return (
              <Card
  key={patient.id}
  className="rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
  onClick={() =>
    setSelectedPatient({
      _id: patient.id, // ✅ crucial — this is what your reports API needs
      name: patient.name,
      age: patient.age,
      surgeryType: patient.surgeryType,
      surgeryDate: patient.surgeryDate, // ✅ add this line
      recoveryHistory: patient.recoveryHistory,
      risk: patient.risk,
      painLevel: patient.painLevel,
      mobility: patient.mobility,
      status: patient.status,
    })
  }
>

                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={patient.profileImage}
                        alt={patient.name}
                      />
                      <AvatarFallback>
                        {patient.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-lg">{patient.name}</h3>
                      <p className="text-sm text-gray-600">
                        {patient.age} years old
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                            patient.status
                          )}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                         {patient.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{patient.surgeryType}</span>
                      <span className="text-xs text-gray-500">Day {days}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Surgery:{" "}
                      {new Date(patient.surgeryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center space-x-1">
                        <Activity className="w-4 h-4 text-red-600" />
                        <span className="text-sm">
                          {patient.painLevel}/10
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Pain</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center space-x-1">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        <span className="text-sm">
                          {patient.risk}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Risk</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{patient.mobility}%</span>
                      </div>
                      <p className="text-xs text-gray-600">Mobility</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last update: {patient.lastUpdate}</span>
                    <span>{patient.recentLogs} log entries</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPatients.length === 0 && !loading && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg text-gray-600 mb-2">No patients found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
