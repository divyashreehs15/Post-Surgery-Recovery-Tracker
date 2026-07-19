import React from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "doctor" | "patient" | string;
  phone?: string;
  address?: string;
  surgeryType?: string;
  surgeryDate?: string;
  surgeon?: string;
  hospital?: string;
  allergies?: string;
  medications?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
}

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDeleted: () => void;
  onAddDetails: (userId: string) => void;
}

export const UserTable: React.FC<Props> = ({
  users,
  onEdit,
  onDeleted,
  onAddDetails,
}) => {
  const [selectedDoctor, setSelectedDoctor] = React.useState<User | null>(null);
  const [patients, setPatients] = React.useState<User[]>([]);
  const [open, setOpen] = React.useState(false);

  // 🧠 Delete User
  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not authorized");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        alert("User deleted successfully");
        onDeleted();
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error while deleting user");
    }
  };

  // 👁️ View Patients (for a doctor)
  const handleViewPatients = async (doctor: User) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Not authorized");

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/assignments/${doctor._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (data.success && data.data?.patientIds?.length) {
        setSelectedDoctor(doctor);
        setPatients(data.data.patientIds);
        setOpen(true);
      } else {
        alert("No patients assigned to this doctor.");
      }
    } catch (err) {
      console.error("Error fetching doctor patients:", err);
      alert("Failed to load patients");
    }
  };

  // 🚫 Unassign Patient
  const handleUnassign = async (patientId: string) => {
    if (!selectedDoctor) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("Not authorized");

    const confirmed = window.confirm("Unassign this patient?");
    if (!confirmed) return;

    try {
      const res = await fetch("http://localhost:5000/api/admin/assignments/unassign", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          patientId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Patient unassigned successfully");
        setPatients(data.assignment.patientIds || []);
      } else {
        alert(data.message || "Failed to unassign");
      }
    } catch (err) {
      console.error("Unassign error:", err);
      alert("Server error while unassigning patient");
    }
  };

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-left">Role</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-4 text-gray-500">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u._id}>
                <td className="border p-2">{u.name}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2 capitalize">{u.role}</td>
                <td className="border p-2 flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => onEdit(u)}>
                    Edit
                  </Button>

                  {u.role === "patient" && (
                    <Button
                      variant="secondary"
                      onClick={() => onAddDetails(u._id)}
                    >
                      {u.phone || u.address || u.surgeryType
                        ? "Edit Patient Details"
                        : "Add Patient Details"}
                    </Button>
                  )}

                  {u.role === "doctor" && (
                    <Button variant="default" onClick={() => handleViewPatients(u)}>
                      View Patients
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(u._id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 🧩 ShadCN Styled Dialog for Doctor's Patients */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Patients of Dr. {selectedDoctor?.name}
            </DialogTitle>
          </DialogHeader>

          {patients.length === 0 ? (
            <p className="text-gray-500">No assigned patients.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {patients.map((p) => (
                <div
                  key={p._id}
                  className="flex justify-between items-center border rounded-md p-2"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.email}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUnassign(p._id)}
                  >
                    Unassign
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Button className="w-full" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
