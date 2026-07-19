import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  onAssigned: () => void;
}

export const AddPatientDropdownDialog: React.FC<Props> = ({ onAssigned }) => {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  // 🔹 Fetch users (doctors + patients)
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Fetched users for dropdown:", data);

        if (data.success) {
          const users = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.users)
            ? data.users
            : [];

          const doctors = users.filter((u: User) => u.role === "doctor");
          const patients = users.filter((u: User) => u.role === "patient");

          setDoctors(doctors);
          setPatients(patients);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    if (open) fetchUsers();
  }, [open]);

  // 🔹 Assign multiple patients to doctor
  const handleAssign = async () => {
    if (!selectedDoctor || selectedPatients.length === 0) {
      alert("Please select a doctor and at least one patient.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return alert("Unauthorized");

    try {
      const res = await fetch("http://localhost:5000/api/admin/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          patientIds: selectedPatients,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert("✅ Patients assigned successfully!");
        // Remove assigned patients from dropdown
        setPatients((prev) =>
          prev.filter((p) => !selectedPatients.includes(p._id))
        );
        setSelectedPatients([]);
        setOpen(false);
        onAssigned();
      } else {
        alert("❌ Failed to assign patients");
      }
    } catch (err) {
      console.error("Error assigning patient:", err);
      alert("Server error during assign.");
    }
  };

  const togglePatientSelection = (id: string) => {
    setSelectedPatients((prev) =>
      prev.includes(id)
        ? prev.filter((pid) => pid !== id)
        : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Assign Patient</Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Patient(s) to Doctor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Doctor Dropdown */}
          <div>
            <Label>Doctor</Label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="border rounded p-2 w-full"
            >
              <option value="">Select Doctor</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.email})
                </option>
              ))}
            </select>
          </div>

          {/* Patients Multi-select */}
          <div>
            <Label>Select Patients</Label>
            <div className="border rounded p-2 max-h-48 overflow-y-auto">
              {patients.length === 0 ? (
                <p className="text-sm text-gray-500">No patients available</p>
              ) : (
                patients.map((pat) => (
                  <label
                    key={pat._id}
                    className="flex items-center gap-2 py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={pat._id}
                      checked={selectedPatients.includes(pat._id)}
                      onChange={() => togglePatientSelection(pat._id)}
                    />
                    <span>
                      {pat.name} ({pat.email})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <Button className="w-full" onClick={handleAssign}>
            Assign Selected Patients
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
