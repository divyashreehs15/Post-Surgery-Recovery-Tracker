import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Clock, 
  User,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { BottomNavigation } from './BottomNavigation';
import { apiCreateAppointment, apiDeleteAppointment, apiListAppointments, apiUpdateAppointment } from '../api/client';

interface Appointment {
  _id?: string;
  id?: string;
  title: string;
  doctor: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: string;
  notes: string;
  reminderEnabled: boolean;
}

interface AppointmentManagerProps {
  user: any;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function AppointmentManager({ user, onNavigate, onLogout }: AppointmentManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    doctor: '',
    date: '',
    time: '',
    location: '',
    type: 'follow-up',
    notes: '',
    reminderEnabled: true
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAppointment, setEditAppointment] = useState({
    title: '',
    doctor: '',
    date: '',
    time: '',
    location: '',
    type: 'follow-up',
    notes: ''
  });

  // ✅ Fetch and split appointments into upcoming/past
  useEffect(() => {
    (async () => {
      try {
        const res = await apiListAppointments();
        const now = new Date();

        const items = (res.data || []).map((a: any) => {
          const d = new Date(a.dateTime);
          const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);

          return {
            _id: a._id,
            title: a.title,
            doctor: a.doctor,
            date: istDate.toISOString().slice(0, 10),
            time: istDate.toISOString().slice(11, 16),
            location: a.location || '',
            type: 'follow-up',
            status: 'confirmed',
            notes: a.notes || '',
            reminderEnabled: true,
          };
        });
        const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case "checkup":
        return "bg-blue-100 text-blue-800";
      case "follow-up":
        return "bg-green-100 text-green-800";
      case "consultation":
        return "bg-yellow-100 text-yellow-800";
      case "therapy":
        return "bg-purple-100 text-purple-800";
      case "surgery":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
        // ✅ Split into upcoming and past
        const upcoming = items.filter((a: any) => {
          const dateTime = new Date(`${a.date}T${a.time}`);
          return dateTime >= now;
        });

        const past = items.filter((a: any) => {
          const dateTime = new Date(`${a.date}T${a.time}`);
          return dateTime < now;
        });

        setAppointments(upcoming);
        setPastAppointments(past);
      } catch (err) {
        console.error('Error loading appointments:', err);
      }
    })();
  }, []);

  // ✅ Refresh function — keeps both upcoming and past synced
  const refresh = async () => {
    const res = await apiListAppointments();
    const now = new Date();

    const items = (res.data || []).map((a: any) => {
      const d = new Date(a.dateTime);
      const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      return {
        _id: a._id,
        title: a.title,
        doctor: a.doctor,
        date: istDate.toISOString().slice(0, 10),
        time: istDate.toISOString().slice(11, 16),
        location: a.location || '',
        type: a.type||'follow-up',
        status: 'confirmed',
        notes: a.notes || '',
        reminderEnabled: true,
      };
    });

    const upcoming = items.filter((a: any) => new Date(`${a.date}T${a.time}`) >= now);
    const past = items.filter((a: any) => new Date(`${a.date}T${a.time}`) < now);

    setAppointments(upcoming);
    setPastAppointments(past);
  };

  // ✅ Add Appointment
  const handleAddAppointment = async () => {
    if (newAppointment.title && newAppointment.doctor && newAppointment.date && newAppointment.time) {
      setLoading(true);
      try {
        const dateTime = new Date(`${newAppointment.date}T${newAppointment.time}:00.000Z`).toISOString();
        await apiCreateAppointment({
  title: newAppointment.title,
  doctor: newAppointment.doctor,
  location: newAppointment.location,
  type: newAppointment.type,   //  <-- THIS IS THE FIX
  dateTime,
  notes: newAppointment.notes || undefined,
});

        await refresh();
        setNewAppointment({
          title: '',
          doctor: '',
          date: '',
          time: '',
          location: '',
          type: newAppointment.type || 'follow-up',
          notes: '',
          reminderEnabled: true,
        });
        setShowAddForm(false);
      } catch {
        alert('Failed to schedule appointment');
      } finally {
        setLoading(false);
      }
    }
  };

  // ✅ Edit logic
  const startEdit = (apt: Appointment) => {
    setEditingId(apt._id || apt.id || null);
    setEditAppointment({
      title: apt.title,
      doctor: apt.doctor,
      date: apt.date,
      time: apt.time,
      location: apt.location,
      type: apt.type,
      notes: apt.notes,
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id?: string) => {
    if (!id) return;
    try {
      const dateTime = new Date(`${editAppointment.date}T${editAppointment.time}:00.000Z`).toISOString();
      await apiUpdateAppointment(id, {
        title: editAppointment.title,
        doctor: editAppointment.doctor,
        location: editAppointment.location,
        dateTime,
        type: editAppointment.type,
        notes: editAppointment.notes || undefined,
      });
      setEditingId(null);
      await refresh();
    } catch {
      alert('Failed to update appointment');
    }
  };

  // ✅ Delete appointment
  const removeAppointment = async (id?: string) => {
    if (!id) return;
    try {
      await apiDeleteAppointment(id);
      await refresh();
    } catch {
      alert('Failed to delete');
    }
  };

  // ✅ Toggle reminder
  const toggleReminder = (id: string) => {
    setAppointments(appointments.map(apt =>
      (apt._id === id || apt.id === id)
        ? { ...apt, reminderEnabled: !apt.reminderEnabled }
        : apt
    ));
  };

  // ✅ Helper color functions
  const getAppointmentTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'follow-up': 'bg-blue-100 text-blue-800',
      'therapy': 'bg-green-100 text-green-800',
      'imaging': 'bg-purple-100 text-purple-800',
      'consultation': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return AlertCircle;
      case 'cancelled': return AlertCircle;
      default: return CheckCircle;
    }
  };

  const isUpcoming = (date: string, time: string): boolean => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return appointmentDateTime > now;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string): string => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('patient-dashboard')}
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl">Appointment Manager</h1>
                  <p className="text-sm text-gray-600">{appointments.length} appointments scheduled</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Add Appointment Form */}
        {showAddForm && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Schedule New Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apt-title">Appointment Title</Label>
                  <Input
                    id="apt-title"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Follow-up Checkup"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-doctor">Doctor/Provider</Label>
                  <Input
                    id="apt-doctor"
                    value={newAppointment.doctor}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, doctor: e.target.value }))}
                    placeholder="e.g., Dr. Sarah Wilson"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apt-date">Date</Label>
                  <Input
                    id="apt-date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-time">Time</Label>
                  <Input
                    id="apt-time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apt-type">Appointment Type</Label>
                  <Select value={newAppointment.type} onValueChange={(value) => setNewAppointment(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="follow-up">Follow-up Checkup</SelectItem>
                      <SelectItem value="therapy">Physical Therapy</SelectItem>
                      <SelectItem value="imaging">Imaging/X-Ray</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                      <SelectItem value="lab">Lab Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-location">Location</Label>
                  <Input
                    id="apt-location"
                    value={newAppointment.location}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Room 205, Medical Center"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apt-notes">Notes (Optional)</Label>
                <Textarea
                  id="apt-notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any special instructions or notes..."
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleAddAppointment} className="rounded-xl" disabled={loading}>
                  {loading ? 'Saving...' : 'Schedule Appointment'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments Section */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <span>Upcoming Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.filter(a => a.date && a.time).length > 0 ? (
              appointments.map((appointment) => {
                const StatusIcon = getStatusIcon(appointment.status);
                const isEditing = editingId && (appointment._id === editingId || appointment.id === editingId);
                
                return (
                  <Card key={appointment._id || appointment.id} className="rounded-2xl border border-gray-100">
                    <CardContent className="p-6">
                      {!isEditing ? (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="text-lg">{appointment.title}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={`px-2 py-1 rounded-full text-xs ${getAppointmentTypeColor(appointment.type)}`}>
                                  {appointment.type.replace('-', ' ')}
                                </Badge>
                                <Badge className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {appointment.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">{appointment.date}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                <span className="text-sm">{appointment.time}</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-purple-600" />
                                <span className="text-sm">{appointment.doctor}</span>
                              </div>
                              {appointment.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm">{appointment.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="p-3 bg-blue-50 rounded-2xl">
                              <p className="text-sm text-gray-700">{appointment.notes}</p>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleReminder(appointment._id || appointment.id || '')}
                              className="rounded-xl"
                            >
                              {appointment.reminderEnabled ? 'Disable Reminder' : 'Enable Reminder'}
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => startEdit(appointment)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removeAppointment(appointment._id)}
                              className="rounded-xl text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Appointment Title</Label>
                              <Input
                                value={editAppointment.title}
                                onChange={(e) => setEditAppointment(prev => ({ ...prev, title: e.target.value }))}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Doctor/Provider</Label>
                              <Input
                                value={editAppointment.doctor}
                                onChange={(e) => setEditAppointment(prev => ({ ...prev, doctor: e.target.value }))}
                                className="rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={editAppointment.date}
                                onChange={(e) => setEditAppointment(prev => ({ ...prev, date: e.target.value }))}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Time</Label>
                              <Input
                                type="time"
                                value={editAppointment.time}
                                onChange={(e) => setEditAppointment(prev => ({ ...prev, time: e.target.value }))}
                                className="rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Appointment Type</Label>
                              <Select value={editAppointment.type} onValueChange={(value) => setEditAppointment(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="follow-up">Follow-up Checkup</SelectItem>
                                  <SelectItem value="therapy">Physical Therapy</SelectItem>
                                  <SelectItem value="imaging">Imaging/X-Ray</SelectItem>
                                  <SelectItem value="consultation">Consultation</SelectItem>
                                  <SelectItem value="surgery">Surgery</SelectItem>
                                  <SelectItem value="lab">Lab Work</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Location</Label>
                              <Input
                                value={editAppointment.location}
                                onChange={(e) => setEditAppointment(prev => ({ ...prev, location: e.target.value }))}
                                className="rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                              value={editAppointment.notes}
                              onChange={(e) => setEditAppointment(prev => ({ ...prev, notes: e.target.value }))}
                              className="rounded-xl min-h-[80px]"
                            />
                          </div>

                          <div className="flex space-x-2">
                            <Button size="sm" className="rounded-xl" onClick={() => saveEdit(appointment._id)}>
                              Save
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline" 
                              onClick={cancelEdit}
                              className="rounded-xl"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No upcoming appointments</p>
                <p className="text-sm text-gray-500">Schedule your next appointment above</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments Section */}
        {pastAppointments.length === 0 ? null : (
  <Card className="rounded-3xl border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <CheckCircle className="w-5 h-5 text-gray-600" />
        <span>Past Appointments</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {pastAppointments.map((appointment) => (
        <div
          key={appointment._id || appointment.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
        >
          <div className="space-y-1">
            <p className="text-sm">{appointment.title}</p>
            <p className="text-xs text-gray-600">{appointment.doctor}</p>
            <p className="text-xs text-gray-500">
              {appointment.date} at {appointment.time}
            </p>
          </div>
          <Badge
            className={`px-2 py-1 rounded-full text-xs ${getAppointmentTypeColor(
              appointment.type
            )}`}
          >
            {appointment.type.replace("-", " ")}
          </Badge>
        </div>
      ))}
    </CardContent>
  </Card>
)}

        {/* Empty State */}
        {appointments.length === 0 && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg text-gray-600 mb-2">No appointments scheduled</h3>
              <p className="text-sm text-gray-500 mb-6">
                Schedule your first appointment to keep track of your medical visits
              </p>
              <Button onClick={() => setShowAddForm(true)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="appointments" 
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}