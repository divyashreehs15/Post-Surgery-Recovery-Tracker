import React, { useState, useEffect } from 'react';

import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  apiListRecoveries,
  apiGetRecordsByPatientId,
  apiGetNotesByPatientId,
  apiAddNote,
  apiToggleNotePin,
  apiListMedications,
  apiGetWoundAnalysisByPatient
} from '../api/client';
import { API_BASE } from '../api/client';
import {
  ArrowLeft,
  Activity,
  Thermometer,
  TrendingUp,
  FileText,
  MessageSquare,
  Plus,
  Pin,
  Clock,
  AlertTriangle,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

interface PatientDetailViewProps {
  patient: any;
  onBack: () => void;
  onLogout: () => void;
}

interface Note {
  _id: string;
  content: string;
  pinned?: boolean;
  priority?: string;
  createdAt?: string;
}

export function PatientDetailView({ patient, onBack, onLogout }: PatientDetailViewProps) {
  const [newNote, setNewNote] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [woundAnalysis, setWoundAnalysis] = useState<any[]>([]);
const [isLoadingImageAnalysis, setIsLoadingImageAnalysis] = useState(false);

useEffect(() => {
  if (selectedTab !== "image-analysis" || !patient?._id) return;

  const loadImageAnalysis = async () => {
    try {
      setIsLoadingImageAnalysis(true);

      const res = await apiGetWoundAnalysisByPatient(patient._id);

      if (res?.success && Array.isArray(res.data)) {
        const imageData = res.data.sort(
          (a: any, b: any) =>
            new Date(b.woundImage?.uploadDate || b.createdAt).getTime() -
            new Date(a.woundImage?.uploadDate || a.createdAt).getTime()
        );

        setWoundAnalysis(imageData);
      } else {
        setWoundAnalysis([]);
      }
    } catch (err) {
      console.error("❌ Failed to load image analysis:", err);
      setWoundAnalysis([]);
    } finally {
      setIsLoadingImageAnalysis(false);
    }
  };

  loadImageAnalysis();
}, [selectedTab, patient?._id]);


  // 🔹 Medication modal state
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [customNote, setCustomNote] = useState('');

  // 🔹 NEW: Recent Notes popup (doctor-only)
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isLoadingRecentNotes, setIsLoadingRecentNotes] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
const [isLoadingMedications, setIsLoadingMedications] = useState(false);

useEffect(() => {
  if (!patient?._id || selectedTab !== "overview") return;

  const fetchMeds = async () => {
    try {
      setIsLoadingMedications(true);
      const res = await apiListMedications(patient._id);

      if (res?.success && Array.isArray(res.data)) {
        setMedications(res.data);
      } else {
        setMedications([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch medications:", err);
      setMedications([]);
    } finally {
      setIsLoadingMedications(false);
    }
  };

  fetchMeds();
}, [selectedTab, patient?._id]);


  // 🔹 Fetch reports when "reports" tab is active
  useEffect(() => {
    if (!patient?._id || selectedTab !== 'reports') return;

    const fetchReports = async () => {
      try {
        setIsLoadingReports(true);

        const recRes = await apiGetRecordsByPatientId(patient._id);

        if (recRes?.success && Array.isArray(recRes.data)) {
          setReports(
            recRes.data.map((r: any) => ({
              _id: r._id || crypto.randomUUID(),
              name: r.file?.originalName || 'Unnamed Report',
              date: new Date(
                r.createdAt || r.file?.uploadDate || Date.now()
              ).toLocaleDateString(),
              size: r.file?.size ? `${(r.file.size / 1024).toFixed(1)} KB` : '—',
              filePath: r.file?.filePath?.replace(/\\/g, '/') || ''
            }))
          );
        } else {
          setReports([]);
        }
      } catch (err) {
        console.error('❌ Error loading reports:', err);
        setReports([]);
      } finally {
        setIsLoadingReports(false);
      }
    };

    fetchReports();
  }, [selectedTab, patient?._id]);

  console.log('🧠 patient.recoveryHistory in DetailView:', patient.recoveryHistory);

  const progressData =
    patient.recoveryHistory?.map((r: any) => ({
      date: new Date(r.date).toLocaleDateString(),
      pain: r.pain,
      risk: r.risk,
      mobility: r.mobility
    })) || [];

  // 🔹 Fetch notes when "notes" tab is active
  useEffect(() => {
    if (!patient?._id || selectedTab !== 'notes') return;

    const fetchNotes = async () => {
      try {
        setIsLoadingNotes(true);
        const res = await apiGetNotesByPatientId(patient._id);

        if (res?.success && Array.isArray(res.data)) {
          setNotes(res.data);
        } else {
          setNotes([]);
        }
      } catch (err) {
        console.error('❌ Error loading notes:', err);
        setNotes([]);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [selectedTab, patient?._id]);

  // 🔹 Add normal note
  const addNote = async (pinned = false, priority = 'normal') => {
    if (!newNote.trim()) return;

    try {
      const res = await apiAddNote({
        patientId: patient._id,
        content: newNote,
        pinned,
        priority
      });

      if (res.success) {
        setNotes((prev) => [res.data, ...prev]);
        setNewNote('');
      } else {
        alert(res.message || 'Failed to add note');
      }
    } catch (err) {
      console.error('❌ Error adding note:', err);
    }
  };

  // 🔹 Helper to show "time ago"
  function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals: Record<string, number> = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, value] of Object.entries(intervals)) {
      const count = Math.floor(seconds / value);
      if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  }

  // 🔹 Overview tab recent activity
  useEffect(() => {
    if (!patient?._id || selectedTab !== 'overview') return;

    const fetchActivity = async () => {
      try {
        const [notesRes, reportsRes, recoveryRes] = await Promise.all([
          apiGetNotesByPatientId(patient._id),
          apiGetRecordsByPatientId(patient._id),
          apiListRecoveries()
        ]);

        const patientRecoveries =
          recoveryRes?.data?.filter(
            (r: any) =>
              String(
                r.patientId?._id ||
                  r.patientId ||
                  r.userId?._id ||
                  r.userId
              ) === String(patient._id)
          ) || [];

        const sortedNotes = (notesRes?.data || []).sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
        const sortedReports = (reportsRes?.data || []).sort(
          (a: any, b: any) =>
            new Date(b.createdAt || b.file?.uploadDate || 0).getTime() -
            new Date(a.createdAt || a.file?.uploadDate || 0).getTime()
        );
        const sortedRecoveries = patientRecoveries.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latestNote = sortedNotes[0];
        const latestReport = sortedReports[0];
        const latestRecovery = sortedRecoveries[0];

        const activities: any[] = [];

        if (latestNote) {
          const doctorName =
            latestNote.doctorId?.name ||
            latestNote.doctorName ||
            'Doctor';
          activities.push({
            type: 'note',
            message: `Note added by ${doctorName}`,
            time: new Date(latestNote.createdAt)
          });
        }

        if (latestReport) {
          activities.push({
            type: 'report',
            message: latestReport.file?.originalName
              ? `${latestReport.file.originalName} uploaded by patient`
              : 'Report uploaded by patient',
            time: new Date(
              latestReport.createdAt ||
                latestReport.file?.uploadDate ||
                Date.now()
            )
          });
        }

        if (latestRecovery) {
          const { risk, pain, mobility } = latestRecovery;
          activities.push({
            type: 'log',
            message: `Log: Risk ${risk}%, Pain ${pain}/10, Mobility ${mobility}%`,
            time: new Date(latestRecovery.date)
          });
        }

        activities.sort(
          (a, b) => b.time.getTime() - a.time.getTime()
        );

        const seen = new Set();
        const uniqueActivities: any[] = [];
        for (const act of activities) {
          if (!seen.has(act.type)) {
            seen.add(act.type);
            uniqueActivities.push(act);
          }
        }

        setRecentActivity(uniqueActivities);
      } catch (err) {
        console.error('❌ Failed to fetch recent activity:', err);
        setRecentActivity([]);
      }
    };

    fetchActivity();
  }, [selectedTab, patient?._id]);

  console.log('🩺 patient.surgeryDate =', patient.surgeryDate);

  let surgeryDateDisplay = '—';
  let daysSinceSurgeryDisplay = '—';

  if (patient.surgeryDate) {
    const parsed = new Date(patient.surgeryDate);
    if (!isNaN(parsed.getTime())) {
      surgeryDateDisplay = parsed.toLocaleDateString();
      const days = Math.floor(
        (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)
      );
      daysSinceSurgeryDisplay = `${days} days`;
    }
  }

 const handleDownload = async (recordId: string) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/api/records/download/${recordId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to download");

    // 👉 Get filename from server header
    const disposition = res.headers.get("Content-Disposition");
    let filename = "report";

    if (disposition && disposition.includes("filename=")) {
      filename = disposition.split("filename=")[1].replace(/"/g, "");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;   // 👉 correct file name here
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Download failed:", err);
    alert("Download failed.");
  }
};


  // 🔹 NEW: Open recent notes popup (top 10 latest)
  const openRecentNotesModal = async () => {
    if (!patient?._id) return;
    try {
      setIsLoadingRecentNotes(true);
      const res = await apiGetNotesByPatientId(patient._id);
      if (res?.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort(
          (a: any, b: any) =>
            new Date(b.createdAt || '').getTime() -
            new Date(a.createdAt || '').getTime()
        );
        setRecentNotes(sorted.slice(0, 10));
      } else {
        setRecentNotes([]);
      }
      setShowNotesModal(true);
    } catch (err) {
      console.error('❌ Failed to load recent notes for modal:', err);
      setRecentNotes([]);
      setShowNotesModal(true);
    } finally {
      setIsLoadingRecentNotes(false);
    }
  };
  // ⭐ Calculate overall recovery percentage
let overallRecovery = "—";

if (patient?.recoveryHistory?.length > 0) {
  const mlValues = patient.recoveryHistory
    .map((r: any) => r.mlRecoveryRate)
    .filter((v: any) => typeof v === "number");

  if (mlValues.length > 0) {
    const avg = mlValues.reduce((a:number, b:number) => a + b, 0) / mlValues.length;
    overallRecovery = `${avg.toFixed(1)}%`;
  }
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={patient.profileImage}
                  alt={patient.name}
                />
                <AvatarFallback>
                  {patient.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl">{patient.name}</h1>
                <p className="text-sm text-gray-600">
                  {patient.age} years old • Day {daysSinceSurgeryDisplay} post-surgery
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="flex w-full rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl">
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-xl">
              Progress
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl">
              Reports
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-xl">
              Notes
            </TabsTrigger>
            <TabsTrigger value="image-analysis">Image Analysis</TabsTrigger>
          </TabsList>

          {/* ---------------- OVERVIEW TAB ---------------- */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Patient Summary */}
            <Card className="rounded-3xl border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg">Surgery Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Procedure:</span>
                        <span>{patient.surgeryType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{surgeryDateDisplay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Days Post-Op:
                        </span>
                        <Badge variant="secondary">
                          {daysSinceSurgeryDisplay}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge
                          className={`capitalize ${
                            patient.status === 'stable'
                              ? 'bg-green-100 text-green-800'
                              : patient.status === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {patient.status === 'stable' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {patient.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg">Current Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-red-600" />
                          <span className="text-gray-600">Pain Level:</span>
                        </div>
                        <span className="text-lg">
                          {patient.painLevel}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
  <div className="flex items-center space-x-2">
    <AlertTriangle className="w-4 h-4 text-yellow-600" />
    <span className="text-gray-600">Risk:</span>
  </div>
  <span className="text-lg">{patient.risk}%</span>
</div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">Mobility:</span>
                        </div>
                        <span className="text-lg">
                          {patient.mobility}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
  <div className="flex items-center space-x-2">
    <TrendingUp className="w-4 h-4 text-purple-600" />
    <span className="text-gray-600">Overall Recovery:</span>
  </div>
  <Badge className="bg-purple-100 text-purple-800 text-md px-3 py-1 rounded-xl">
    {overallRecovery}
  </Badge>
</div>

                  </div>
                </div>
              </CardContent>
            </Card>
            {/* ---------------- MEDICATION NAMES ONLY ---------------- */}
<Card className="rounded-3xl border-0 shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center space-x-2">
      {/* <Thermometer className="w-5 h-5 text-primary" /> */}
      <span>💊 Medications</span>
    </CardTitle>
  </CardHeader>

  <CardContent>
    {isLoadingMedications ? (
      <p className="text-center text-gray-500 py-4">Loading...</p>
    ) : medications.length === 0 ? (
      <p className="text-center text-gray-500 py-4">No medications added</p>
    ) : (
      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-xl border border-blue-200">
        {medications.map((med) => med.name).join(", ")}
      </p>
    )}
  </CardContent>
</Card>

            {/* Recent Activity */}
            <Card className="rounded-3xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((a, i) => {
                    const isNote = a.type === 'note';
                    return (
                      <div
                        key={i}
                        className={`flex items-start space-x-4 p-4 rounded-2xl ${
                          a.type === 'log'
                            ? 'bg-blue-50'
                            : a.type === 'report'
                            ? 'bg-green-50'
                            : 'bg-orange-50'
                        } ${isNote ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={isNote ? openRecentNotesModal : undefined}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            a.type === 'log'
                              ? 'bg-blue-600'
                              : a.type === 'report'
                              ? 'bg-green-600'
                              : 'bg-orange-600'
                          }`}
                        ></div>
                        <div>
                          <p className="text-sm">{a.message}</p>
                          <p className="text-xs text-gray-500">
                            {timeAgo(a.time)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No recent activity yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- PROGRESS TAB ---------------- */}
          <TabsContent value="progress" className="mt-6">
            <Card className="rounded-3xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recovery Progress Charts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {patient.recoveryHistory &&
                patient.recoveryHistory.length > 0 ? (
                  <>
                    {/* Pain Level Chart */}
                    <div className="space-y-4">
                      <h4 className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-red-600" />
                        <span>Pain Level (1-10)</span>
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <LineChart
                            data={patient.recoveryHistory.map(
                              (r: any) => ({
                                date: new Date(
                                  r.date
                                ).toLocaleDateString(),
                                pain: r.pain
                              })
                            )}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis dataKey="date" stroke="#666" />
                            <YAxis domain={[0, 10]} stroke="#666" />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="pain"
                              stroke="#ef4444"
                              strokeWidth={3}
                              dot={{
                                fill: '#ef4444',
                                strokeWidth: 2,
                                r: 4
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    {/* Risk Chart */}
<div className="space-y-4">
  <h4 className="flex items-center space-x-2">
    <AlertTriangle className="w-4 h-4 text-yellow-600" />
    <span>Risk (%)</span>
  </h4>
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={patient.recoveryHistory.map((r: any) => ({
          date: new Date(r.date).toLocaleDateString(),
          risk: r.risk
        }))}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" stroke="#666" />
        <YAxis domain={[0, 100]} stroke="#666" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="risk"
          stroke="#F4B400"
          strokeWidth={3}
          dot={{ fill: "#F4B400", strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>


                    {/* Mobility Chart */}
                    <div className="space-y-4">
                      <h4 className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span>Mobility (%)</span>
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <LineChart
                            data={patient.recoveryHistory.map(
                              (r: any) => ({
                                date: new Date(
                                  r.date
                                ).toLocaleDateString(),
                                mobility: r.mobility
                              })
                            )}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis dataKey="date" stroke="#666" />
                            <YAxis domain={[0, 100]} stroke="#666" />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="mobility"
                              stroke="#4CAF50"
                              strokeWidth={3}
                              dot={{
                                fill: '#4CAF50',
                                strokeWidth: 2,
                                r: 4
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No recovery data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- REPORTS TAB ---------------- */}
          <TabsContent value="reports" className="mt-6">
            <Card className="rounded-3xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Uploaded Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <p className="text-center text-gray-500 py-8">
                    Loading reports...
                  </p>
                ) : reports.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((report) => (
                      <div
                        key={report._id}
                        className="p-4 bg-gray-50 rounded-2xl space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-xs text-gray-500">
                            {report.size}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm">{report.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {report.date}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-xl text-xs"
                            onClick={() => {
                              const url = `http://localhost:5000/${report.filePath}`;
                              window.open(url, '_blank');
                            }}
                          >
                            View
                          </Button>

                          <Button
  variant="outline"
  size="sm"
  className="flex-1 rounded-xl text-xs"
  onClick={() => handleDownload(report._id)}
>
  Download
</Button>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No reports uploaded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- NOTES TAB ---------------- */}
          <TabsContent value="notes" className="mt-6 space-y-6">
            {/* Add Medication Button */}
            <div className="flex justify-end">
              <Button
                className="rounded-xl bg-green-600 text-white hover:bg-blue-700"
                onClick={() => setShowMedicationModal(true)}
              >
                + Add Medication
              </Button>
            </div>

            {/* Add Note */}
            <Card className="rounded-3xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Add New Note</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your clinical notes here..."
                  className="rounded-xl min-h-[120px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => addNote(true, 'high')}
                  >
                    <Pin className="w-4 h-4 mr-2" />
                    Pin Note
                  </Button>

                  <Button
                    onClick={() => addNote()}
                    className="rounded-xl"
                  >
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Notes */}
            <Card className="rounded-3xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span>Clinical Notes History</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {notes.length > 0 ? (
                  notes.map((note: Note) => (
                    <div
                      key={note._id}
                      className={`p-4 rounded-2xl border-l-4 ${
                        note.pinned
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={async () => {
                              try {
                                const res =
                                  await apiToggleNotePin(note._id);
                                if (res.success) {
                                  setNotes((prev) =>
                                    prev
                                      .map((n) =>
                                        n._id === note._id
                                          ? res.data
                                          : n
                                      )
                                      .sort(
                                        (a, b) =>
                                          Number(b.pinned) - Number(a.pinned)
                                      )
                                  );
                                }
                              } catch (err) {
                                console.error(
                                  '❌ Failed to toggle pin:',
                                  err
                                );
                              }
                            }}
                          >
                            <Pin
                              className={`w-4 h-4 ${
                                note.pinned ? 'text-yellow-600' : 'text-gray-400'
                              }`}
                            />
                          </Button>

                          {note.priority === 'high' && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-100 text-orange-800 text-xs"
                            >
                              Important
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {note.createdAt
                              ? new Date(
                                  note.createdAt
                                ).toLocaleString()
                              : '—'}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    No notes available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        <TabsContent value="image-analysis" className="mt-6">
  <Card className="rounded-3xl border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <span>Wound Image Analysis</span>
      </CardTitle>
    </CardHeader>

    <CardContent>
      {isLoadingImageAnalysis ? (
        <p className="text-center text-gray-500 py-6">Loading...</p>
      ) : woundAnalysis?.length === 0 ? (
        <p className="text-center text-gray-500 py-6">
          No wound image analysis available.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {woundAnalysis.map((rec: any) => {
            const imageUrl = rec.woundImage?.filePath
              ? `${API_BASE}/${rec.woundImage.filePath.replace(/\\/g, "/")}`
              : null;

            return (
              <div
                key={rec._id}
                className="p-4 bg-gray-50 rounded-2xl border space-y-3"
              >                {/* View Button (like reports) */}

                {/* Info */}
                <p className="text-xs text-gray-500">
                  Uploaded:{" "}
                  {new Date(
                    rec.woundImage?.uploadDate || rec.createdAt
                  ).toLocaleString()}
                </p>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Severity</span>
                  <Badge
                    className={
                      rec.mlWoundAnalysis?.infected
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {rec.mlWoundAnalysis?.infected ? "HIGH" : "LOW"}
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Infection</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    {(rec.mlWoundAnalysis?.infectionProb * 100).toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge
                    className={
                      rec.mlWoundAnalysis?.infected
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {rec.mlWoundAnalysis?.infected ? "Infected" : "Normal"}
                  </Badge>
                  
                </div>
                {imageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl text-xs"
                    onClick={() => window.open(imageUrl, "_blank")}
                  >
                    👁 View
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>




        </Tabs>
      </div>

      {/* 🔹 NEW: Recent Notes Popup (doctor-only) */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Recent Doctor Notes</DialogTitle>
          </DialogHeader>

          {isLoadingRecentNotes ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Loading notes...
            </p>
          ) : recentNotes.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No notes found for this patient.
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {recentNotes.map((note) => (
                <div
                  key={note._id}
                  className={`p-3 rounded-2xl border-l-4 ${
                    note.pinned
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.pinned && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          📌 Pinned
                        </Badge>
                      )}
                      {note.priority === 'high' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          ⚠ Important
                        </Badge>
                      )}
                    </div>
                    {note.createdAt && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Medication Popup Modal (existing) */}
      <Dialog open={showMedicationModal} onOpenChange={setShowMedicationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Medicine Name */}
            <div>
              <label className="text-sm text-gray-600">Medicine Name</label>
              <Input
                className="mt-1 rounded-xl"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g., Paracetamol"
              />
            </div>

            {/* Dosage */}
            <div>
              <label className="text-sm text-gray-600">Dosage</label>
              <Input
                className="mt-1 rounded-xl"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 400 mg"
              />
            </div>

            {/* Frequency Dropdown */}
            <div>
              <label className="text-sm text-gray-600">Frequency</label>
              <select
                className="w-full mt-1 p-2 rounded-xl border bg-white text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="">Select frequency</option>
                <option value="once">Once</option>
                <option value="twice">Twice</option>
                <option value="thrice">Thrice</option>
                <option value="every 4 hours">Every 4 hours</option>
                <option value="every 6 hours">Every 6 hours</option>
                <option value="every 8 hours">Every 8 hours</option>
                <option value="every 12 hours">Every 12 hours</option>
                <option value="as needed">As needed</option>
              </select>
            </div>

            {/* Reminder Time */}
            <div>
              <label className="text-sm text-gray-600">
                Reminder Time (IST)
              </label>
              <Input
                type="time"
                className="mt-1 rounded-xl"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>

            {/* Custom Note */}
            <div>
              <label className="text-sm text-gray-600">Custom Note</label>
              <Textarea
                className="mt-1 rounded-xl min-h-[80px]"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Any additional instructions..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowMedicationModal(false)}
            >
              Cancel
            </Button>

            <Button
              className="rounded-xl bg-green-600 hover:bg-green-700"
              onClick={async () => {
                if (!medName.trim()) {
                  alert('Please enter medicine name');
                  return;
                }

                const medicationNote = `Medication Added:
• Name: ${medName}
• Dosage: ${dosage || '-'}
• Frequency: ${frequency || '-'}
• Reminder Time: ${reminderTime || '-'}
• Note: ${customNote || '-'}`;

                try {
                  const res = await apiAddNote({
                    patientId: patient._id,
                    content: medicationNote,
                    pinned: false,
                    priority: 'normal'
                  });

                  if (res.success) {
                    setNotes((prev) => [res.data, ...prev]);

                    // Reset fields
                    setMedName('');
                    setDosage('');
                    setFrequency('');
                    setReminderTime('');
                    setCustomNote('');
                    setShowMedicationModal(false);
                  } else {
                    alert(res.message || 'Failed to save medication');
                  }
                } catch (err) {
                  console.error('Medication note error:', err);
                  alert('Failed to save medication');
                }
              }}
            >
              Save Medication
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}