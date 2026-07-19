import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Pill, 
  Plus, 
  Clock, 
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Bell
} from 'lucide-react';
import { BottomNavigation } from './BottomNavigation';
import { apiCreateMedication, apiDeleteMedication, apiListMedications,apiGetUserSettings, apiUpdateUserSettings, apiUpdateMedication, apiMarkMedicationTaken } from '../api/client';

interface MedicationManagerProps {
  user: any;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function MedicationManager({ user, onNavigate, onLogout }: MedicationManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
  pushNotifications: true,
  emailReminders: false,
  smartSnooze: true
});
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: [''],
    notes: '',
    enabled: true
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMedication, setEditMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    notes: '',
    timesCsv: ''
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiListMedications();
        setMedications(res.data || []);
      } catch {
        // ignore for now
      }
    })();
  }, []);
  useEffect(() => {
  (async () => {
    try {
      const res = await apiGetUserSettings(user.id);
      if (res.data?.notificationSettings) {
        setNotificationSettings(res.data.notificationSettings);
      }
    } catch (error) {
      console.error('Failed to load notification settings');
    }
  })();
}, [user.id]);

  const refresh = async () => {
    const res = await apiListMedications();
    setMedications(res.data || []);
  };

  const handleAddMedication = async () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      setLoading(true);
      try {
        const payload: any = {
          name: newMedication.name,
          dosage: newMedication.dosage,
          frequency: newMedication.frequency,
          notes: newMedication.notes || undefined,
        };
        if (newMedication.times && newMedication.times[0]) {
          payload.times = newMedication.times;
        }
        await apiCreateMedication({
  ...payload,
  patientId: user.id      // 👍 store correctly for doctor
});

        await refresh();
        setNewMedication({ name: '', dosage: '', frequency: '', times: [''], notes: '', enabled: true });
        setShowAddForm(false);
      } catch {
        alert('Failed to add medication');
      } finally {
        setLoading(false);
      }
    }
  };

  const startEdit = (m: any) => {
    setEditingId(m._id);
    setEditMedication({
      name: m.name || '',
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      notes: m.notes || '',
      timesCsv: Array.isArray(m.times) ? m.times.join(',') : ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id?: string) => {
    if (!id) return;
    try {
      const payload: any = {
        name: editMedication.name,
        dosage: editMedication.dosage,
        frequency: editMedication.frequency,
        notes: editMedication.notes,
      };
      const times = editMedication.timesCsv.split(',').map(t => t.trim()).filter(Boolean);
      if (times.length) payload.times = times;
      await apiUpdateMedication(id, payload);
      setEditingId(null);
      await refresh();
    } catch {
      alert('Failed to update medication');
    }
  };

  const toggleMedication = async (id: string, enabled: boolean) => {
    try {
      await apiUpdateMedication(id, { enabled: !enabled });
      await refresh();
    } catch {
      alert('Failed to update');
    }
  };

  const markTaken = async (id: string) => {
    try {
      await apiMarkMedicationTaken(id);
      await refresh();
    } catch {
      alert('Failed to mark as taken');
    }
  };

  const removeMedication = async (id: string) => {
    try {
      await apiDeleteMedication(id);
      await refresh();
    } catch {
      alert('Failed to delete');
    }
  };

  const getNextDoseStatus = (_: string) => {
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'due': return 'bg-red-100 text-red-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'not-set': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'due': return AlertCircle;
      case 'upcoming': return Clock;
      case 'not-set': return AlertCircle;
      default: return Clock;
    }
  };
  const updateNotificationSetting = async (key: string, value: boolean) => {
  try {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    
    await apiUpdateUserSettings(user.id, {
      notificationSettings: newSettings
    });
  } catch (error) {
    console.error('Failed to update notification settings');
    // Revert on error
    setNotificationSettings(notificationSettings);
  }
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
                <Pill className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl">Medication Manager</h1>
                  <p className="text-sm text-gray-600">{medications.length} medications tracked</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Add Medication Form */}
        {showAddForm && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Add New Medication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="med-name">Medication Name</Label>
                  <Input
                    id="med-name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Ibuprofen"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-dosage">Dosage</Label>
                  <Input
                    id="med-dosage"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 400mg"
                    className="rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="med-frequency">Frequency</Label>
                <Select value={newMedication.frequency} onValueChange={(value) => setNewMedication(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                    <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                    <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                    <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="med-time">Reminder Time (HH:mm, optional)</Label>
                <Input
                  id="med-time"
                  type="time"
                  value={newMedication.times[0]}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, times: [e.target.value] }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="med-notes">Notes (Optional)</Label>
                <Input
                  id="med-notes"
                  value={newMedication.notes}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Take with food"
                  className="rounded-xl"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleAddMedication} className="rounded-xl" disabled={loading}>
                  {loading ? 'Saving...' : 'Add Medication'}
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

        {/* Medications List */}
        <div className="space-y-4">
          {medications.map((medication: any) => {
            const status = getNextDoseStatus('');
            const StatusIcon = getStatusIcon(status);
            const isEditing = editingId === medication._id;
            
            return (
              <Card key={medication._id} className="rounded-3xl border-0 shadow-lg">
                <CardContent className="p-6">
                  {!isEditing ? (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                          <Pill className="w-6 h-6 text-purple-600" />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg">{medication.name}</h3>
                              <p className="text-sm text-gray-600">{medication.dosage} • {medication.frequency}</p>
                              {medication.notes && (
                                <p className="text-xs text-gray-500 mt-1">{medication.notes}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {medication.lastTaken ? `Last taken: ${new Date(medication.lastTaken).toLocaleString()}` : 'Last taken: —'}
                              </p>
                            </div>
                            <Switch 
                              checked={!!(medication as any).enabled}
                              onCheckedChange={() => toggleMedication(medication._id, !!(medication as any).enabled)}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-4 h-4" />
                              <span className="text-sm">Next dose:</span>
                              <Badge className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                                {medication.nextDose ? new Date(medication.nextDose).toLocaleString() : 'Not set'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => startEdit(medication)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removeMedication(medication._id)}
                              className="rounded-xl text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => markTaken(medication._id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Taken
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={editMedication.name}
                            onChange={(e) => setEditMedication(prev => ({ ...prev, name: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dosage</Label>
                          <Input
                            value={editMedication.dosage}
                            onChange={(e) => setEditMedication(prev => ({ ...prev, dosage: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Input
                            value={editMedication.frequency}
                            onChange={(e) => setEditMedication(prev => ({ ...prev, frequency: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Times (comma separated HH:mm)</Label>
                          <Input
                            placeholder="08:00,13:00,20:00"
                            value={editMedication.timesCsv}
                            onChange={(e) => setEditMedication(prev => ({ ...prev, timesCsv: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input
                          value={editMedication.notes}
                          onChange={(e) => setEditMedication(prev => ({ ...prev, notes: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" className="rounded-xl" onClick={() => saveEdit(medication._id)}>
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
          })}
        </div>

        {/* Empty State */}
        {medications.length === 0 && (
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg text-gray-600 mb-2">No medications added</h3>
              <p className="text-sm text-gray-500 mb-6">
                Add your medications to set up reminders and track your doses
              </p>
              <Button onClick={() => setShowAddForm(true)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Medication
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reminder Settings */}
        <Card className="rounded-3xl border-0 shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center space-x-2">
      <Bell className="w-5 h-5 text-primary" />
      <span>Reminder Settings</span>
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
      <div>
        <h4 className="text-sm font-medium">Push Notifications</h4>
        <p className="text-xs text-gray-600">
          Get reminded when it's time to take medication
        </p>
      </div>
      <Switch 
        checked={notificationSettings.pushNotifications}
        onCheckedChange={(checked) => 
          updateNotificationSetting('pushNotifications', checked)
        }
      />
    </div>

    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
      <div>
        <h4 className="text-sm font-medium">Email Reminders</h4>
        <p className="text-xs text-gray-600">
          Backup reminders sent to your email
        </p>
      </div>
      <Switch 
        checked={notificationSettings.emailReminders}
        onCheckedChange={(checked) => 
          updateNotificationSetting('emailReminders', checked)
        }
      />
    </div>

    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
      <div>
        <h4 className="text-sm font-medium">Smart Snooze</h4>
        <p className="text-xs text-gray-600">
          Automatically remind again in 15 minutes if not taken
        </p>
      </div>
      <Switch 
        checked={notificationSettings.smartSnooze}
        onCheckedChange={(checked) => 
          updateNotificationSetting('smartSnooze', checked)
        }
      />
    </div>
  </CardContent>
</Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="medications" 
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}