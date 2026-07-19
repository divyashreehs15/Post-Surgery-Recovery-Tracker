import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Activity, 
  Thermometer,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { BottomNavigation } from './BottomNavigation';
import { apiCreateRecovery,apiCreateRecord } from '../api/client';

interface DailyLogFormProps {
  user: any;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}
const SYMPTOM_WEIGHTS: Record<string, number> = {
  fever: 15,
  severe_pain: 30,
  swelling: 10,
  bleeding: 25,
  dizziness: 10,
  vomiting: 10,
};


export function DailyLogForm({ user, onNavigate, onLogout }: DailyLogFormProps) {
  const [painLevel, setPainLevel] = useState([3]);
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({
  fever: false,
  severe_pain: false,
  swelling: false,
  bleeding: false,
  dizziness: false,
  vomiting: false,
});

  const [woundStatus, setWoundStatus] = useState('');
  const [mobility, setMobility] = useState({
    walking: false,
    stairs: false,
    dressing: false,
    bathing: false,
    exercises: false
  });
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleMobilityChange = (activity: string, checked: boolean) => {
    setMobility(prev => ({ ...prev, [activity]: checked }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };
  const handleSymptomChange = (key: string, checked: boolean) => {
  setSymptoms(prev => ({ ...prev, [key]: checked }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  try {

    const recoveryForm = new FormData();
    recoveryForm.append('patientName', user?.name || 'Unknown');
    recoveryForm.append("woundStatus", woundStatus);
    recoveryForm.append('surgeryType', woundStatus);
    recoveryForm.append('recoveryProgress', String(painLevel[0]));
    recoveryForm.append('symptomScore', String(calculateRiskScore()));
    recoveryForm.append('followUpDate', new Date().toISOString());

    const selectedSymptoms = Object.keys(symptoms)
      .filter(k => symptoms[k])
      .join(', ');

    recoveryForm.append(
      'notes',
      `Symptoms: ${selectedSymptoms || "None"}, Mobility: ${Object.keys(mobility)
        .filter(k => (mobility as any)[k])
        .join(', ')}. ${notes}`
    );

    // ✅ Attach wound image BEFORE calling API
    if (selectedFile) {
      recoveryForm.append("file", selectedFile);
    }

    // ✅ Only ONE call to createRecovery
    await apiCreateRecovery(recoveryForm);

    onNavigate('patient-dashboard');
  } catch (err) {
    console.error('❌ Error submitting daily log:', err);
    alert('Failed to submit log. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  const getPainLevelColor = (level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-50';
    if (level <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPainLevelText = (level: number) => {
    if (level <= 3) return 'Mild';
    if (level <= 6) return 'Moderate';
    return 'Severe';
  };
  const calculateRiskScore = () => {
  return Object.keys(symptoms)
    .filter(k => symptoms[k])
    .reduce((sum, key) => sum + SYMPTOM_WEIGHTS[key], 0);
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50 pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('patient-dashboard')}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl">Daily Log Entry</h1>
              <p className="text-sm text-gray-600">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pain Level */}
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <span>Pain Level Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Current Pain Level</Label>
                  <Badge className={`px-3 py-1 rounded-full ${getPainLevelColor(painLevel[0])}`}>
                    {painLevel[0]}/10 - {getPainLevelText(painLevel[0])}
                  </Badge>
                </div>
                <div className="px-2">
                  <Slider
                    value={painLevel}
                    onValueChange={setPainLevel}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>No Pain (0)</span>
                    <span>Worst Pain (10)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          {/* Symptom Risk Assessment */}
<Card className="rounded-3xl border-0 shadow-lg">
  <CardHeader className="pb-4">
    <CardTitle className="flex items-center space-x-2">
      <AlertTriangle className="w-5 h-5 text-primary" />
      <span>Symptom Check</span>
    </CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    <Label>Select symptoms you experienced today:</Label>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Object.keys(SYMPTOM_WEIGHTS).map(key => (
        <div
          key={key}
          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl"
        >
          <Checkbox
            checked={symptoms[key]}
            onCheckedChange={(checked) => handleSymptomChange(key, !!checked)}
          />

          {/* Removed points display */}
          <Label className="flex-1 capitalize text-sm">
            {key.replace(/_/g, ' ')}
          </Label>
        </div>
      ))}
    </div>
  </CardContent>
</Card>


          {/* Wound Status */}
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <span>Wound Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>How does your wound look today?</Label>
                <Select value={woundStatus} onValueChange={setWoundStatus}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select wound status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healing-well">Healing well - No concerns</SelectItem>
                    <SelectItem value="slightly-red">Slightly red around edges</SelectItem>
                    <SelectItem value="swollen">More swollen than usual</SelectItem>
                    <SelectItem value="drainage">Some drainage present</SelectItem>
                    <SelectItem value="concerning">Concerning changes - needs attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Mobility Checklist */}
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>Mobility & Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Activities completed today:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'walking', label: 'Walking (short distances)' },
                    { key: 'stairs', label: 'Climbing stairs' },
                    { key: 'dressing', label: 'Getting dressed independently' },
                    { key: 'bathing', label: 'Bathing/showering' },
                    { key: 'exercises', label: 'Prescribed exercises' }
                  ].map((activity) => (
                    <div key={activity.key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                      <Checkbox
                        id={activity.key}
                        checked={mobility[activity.key as keyof typeof mobility]}
                        onCheckedChange={(checked) => handleMobilityChange(activity.key, !!checked)}
                      />
                      <Label htmlFor={activity.key} className="flex-1 text-sm">
                        {activity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-primary" />
                <span>Photo Documentation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Upload a photo of your wound (optional)</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Label
                      htmlFor="photo-upload"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                    >
                      Choose File
                    </Label>
                  </div>
                </div>
                {selectedFile && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-800">{selectedFile.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Additional Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Any other observations or concerns?</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe how you're feeling, any concerns, or questions for your doctor..."
                  className="rounded-xl min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardContent className="p-6">
              <Button 
                type="submit"
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 text-lg"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Daily Log Entry'}
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Your doctor will be able to review this entry
              </p>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="logs" 
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}