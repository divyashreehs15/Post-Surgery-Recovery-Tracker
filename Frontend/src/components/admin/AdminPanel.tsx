import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { AddUserDialog } from "./AddUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { UserTable, User as TableUser } from "./UserTable";
import { AddPatientDetailsDialog } from "./AddPatientDetailsDialog";
import { AddPatientDropdownDialog } from "./AddPatientDropdownDialog";
import { Input } from "../ui/input";       // ⭐ NEW

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<TableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TableUser | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");  // ⭐ NEW

  // 🔹 Fetch all users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const res = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Fetched users:", data);

        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        } else if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error("Unexpected user data format:", data);
          setUsers([]);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      }
    };

    fetchUsers();
  }, [refresh]);

  // 🔹 Find patient
  const selectedPatient = users.find((u) => u._id === selectedPatientId) || null;

  // ⭐ GLOBAL SEARCH FILTER
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const doctors = filteredUsers.filter((u) => u.role === "doctor");
  const patients = filteredUsers.filter((u) => u.role === "patient");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col gap-4">

            {/* HEADER ROW */}
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">Admin Panel</CardTitle>

              <div className="flex gap-2">
                <AddPatientDropdownDialog onAssigned={() => setRefresh(!refresh)} />
                <AddUserDialog onAdded={() => setRefresh(!refresh)} />
              </div>
            </div>

            {/* ⭐ GLOBAL SEARCH BAR */}
            <Input
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs border border-gray-300"
            />
          </div>
        </CardHeader>

        <CardContent>

          {/* DOCTORS TABLE */}
          <h2 className="text-xl font-semibold mt-4 mb-3">Doctors</h2>
          <UserTable
            users={doctors}
            onEdit={(user) => setSelectedUser(user)}
            onDeleted={() => setRefresh(!refresh)}
            onAddDetails={() => {}}
          />

          {/* PATIENTS TABLE */}
          <h2 className="text-xl font-semibold mt-10 mb-3">Patients</h2>
          <UserTable
            users={patients}
            onEdit={(user) => setSelectedUser(user)}
            onDeleted={() => setRefresh(!refresh)}
            onAddDetails={(userId) => setSelectedPatientId(userId)}
          />
        </CardContent>
      </Card>

      {/* EDIT USER */}
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => setRefresh(!refresh)}
        />
      )}

      {/* ADD/EDIT PATIENT DETAILS */}
      {selectedPatient && (
        <AddPatientDetailsDialog
          user={selectedPatient}
          open={!!selectedPatientId}
          onOpenChange={(open) => {
            if (!open) setSelectedPatientId(null);
          }}
          onDetailsAdded={() => {
            setRefresh(!refresh);
            setSelectedPatientId(null);
          }}
        />
      )}
    </div>
  );
};