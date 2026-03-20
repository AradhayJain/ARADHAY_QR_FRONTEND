import React, { useState } from "react";
import { useUserFullActivity } from "@/hooks/useUserFullActivity";
import ContributionCalendar from "@/components/ContributionCalendar";

interface UserOption {
  id: string;
  name: string;
}

// Dummy user list for demo; replace with real user fetch
const USERS: UserOption[] = [
  { id: "user1", name: "User 1" },
  { id: "user2", name: "User 2" },
];

const AdminActivityViewer: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const { data, isLoading, error } = useUserFullActivity(selectedUser);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
          <option value="">Select user</option>
          {USERS.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {selectedUser ? (
        isLoading ? (
          <div>Loading activity...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : (
          <ContributionCalendar activities={data} />
        )
      ) : (
        <div>Select a user to view activity.</div>
      )}
    </div>
  );
};

export default AdminActivityViewer;
