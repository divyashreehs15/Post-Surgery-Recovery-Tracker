import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface DoctorPatientsDialogProps {
  doctorId: string;
  doctorName: string;
  open: boolean;
  onClose: () => void;
}

export const DoctorPatientsDialog: React.FC<DoctorPatientsDialogProps> = ({
  doctorId,
  doctorName,
  open,
  onClose,
}) => {
  const [patients, setPatients] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch assigned patients for this doctor
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/assignments/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.patientIds) {
        setPatients(data.data.patientIds);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error("Error fetching doctor patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Unassign one patient
  const handleUnassign = async (patientId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/assignments/unassign", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId, patientId }),
      });
      const data = await res.json();
      if (data.success) {
        setPatients(patients.filter((p) => p._id !== patientId));
      } else {
        alert(data.message || "Failed to unassign");
      }
    } catch (err) {
      console.error("Unassign error:", err);
    }
  };

  useEffect(() => {
    if (open) fetchPatients();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assigned Patients for Dr. {doctorName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p>Loading...</p>
        ) : patients.length > 0 ? (
          <div className="space-y-2">
            {patients.map((patient) => (
              <div
                key={patient._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUnassign(patient._id)}
                >
                  Unassign
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No patients assigned to this doctor.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
