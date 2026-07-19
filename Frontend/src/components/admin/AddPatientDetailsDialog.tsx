import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { User } from "./UserTable";

interface Props {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetailsAdded: () => void;
}

export const AddPatientDetailsDialog: React.FC<Props> = ({
  user,
  open,
  onOpenChange,
  onDetailsAdded,
}) => {
  const [details, setDetails] = useState({
    phone: "",
    address: "",
    surgeryType: "",
    surgeryDate: "",
    surgeon: "",
    hospital: "",
    allergies: "",
    medications: "",
    emergencyContact: "",
    dateOfBirth: "",
  });

  // 🔹 Fetch existing patient details (only if the user is a patient)
  useEffect(() => {
    const fetchDetails = async (id: string) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(
          `http://localhost:5000/api/admin/users/${id}/details`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          setDetails({
            phone: d.phone || "",
            address: d.address || "",
            surgeryType: d.surgeryType || "",
            surgeryDate: d.surgeryDate
              ? new Date(d.surgeryDate).toISOString().split("T")[0]
              : "",
            surgeon: d.surgeon || "",
            hospital: d.hospital || "",
            allergies: d.allergies || "",
            medications: d.medications || "",
            emergencyContact: d.emergencyContact || "",
            dateOfBirth: d.dateOfBirth
              ? new Date(d.dateOfBirth).toISOString().split("T")[0]
              : "", // ✅ convert to yyyy-mm-dd
          });
        } else {
          setDetails({
            phone: "",
            address: "",
            surgeryType: "",
            surgeryDate: "",
            surgeon: "",
            hospital: "",
            allergies: "",
            medications: "",
            emergencyContact: "",
            dateOfBirth: "",
          });
        }
      } catch (err) {
        console.error("❌ Error fetching patient details:", err);
      }
    };

    if (open && user && user.role.toLowerCase() === "patient") {
      fetchDetails(user._id);
    }
  }, [open, user]);

  if (!user || user.role.toLowerCase() !== "patient") return null;

  // 🔹 Save (Add or Edit)
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Unauthorized");

    const method =
      details.address || details.phone || details.hospital ? "PUT" : "POST";

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/users/${user._id}/details`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(details),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("Patient details saved successfully");
        onOpenChange(false);
        onDetailsAdded();
      } else {
        alert(data.message || "Failed to save details");
      }
    } catch (err) {
      console.error("❌ Server error saving details:", err);
      alert("Server error saving details");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {details.phone || details.address
              ? "Edit Patient Details"
              : "Add Patient Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <Label className="capitalize">
                {key === "dateOfBirth"
                  ? "Date of Birth"
                  : key === "surgeryDate"
                  ? "Surgery Date"
                  : key}
              </Label>
              <Input
                type={
                  key === "dateOfBirth" || key === "surgeryDate"
                    ? "date"
                    : "text"
                }
                value={value}
                onChange={(e) =>
                  setDetails({ ...details, [key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>

        <Button className="w-full mt-4" onClick={handleSave}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
};
