import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface Props {
  onAdded: () => void;
}

export const AddUserDialog: React.FC<Props> = ({ onAdded }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("patient");
  const [password, setPassword] = useState("");

  const handleAdd = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Unauthorized");

    try {
      // ✅ FIXED URL HERE
      const res = await fetch("http://localhost:5000/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (data.success) {
        alert("User added successfully");
        onAdded();
        setOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("patient");
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
      alert("Server error adding user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Add New User</Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Role</Label>
            <select
              className="border rounded p-2 w-full"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </div>

          <Button className="w-full" onClick={handleAdd}>
            Add User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
