import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getAdminUsers,
  addAdminUser,
  removeAdminUser,
} from "../../server/admin-users.js";
import { useState, useEffect } from "react";
import { useIdentity } from "../../lib/identity-context.js";
import { UserPlus, Trash2, Shield, Mail, Eye, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async ({ context }) => {
    const { role } = context as { role: string };
    if (role !== "admin") {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user } = useIdentity();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"reviewer" | "admin">("reviewer");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [identityStatus, setIdentityStatus] = useState("");

  const syncIdentityUser = async (
    email: string,
    name: string | undefined,
    method: "POST" | "DELETE"
  ) => {
    try {
      const res = await fetch("/api/manage-identity-user", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIdentityStatus(
          `Portal updated, but Identity sync failed: ${data.error}`
        );
        return;
      }
      if (data.alreadyExists) {
        setIdentityStatus("User already has a Netlify Identity account.");
      } else if (method === "POST") {
        setIdentityStatus("Invite email sent to the user.");
      }
    } catch {
      setIdentityStatus(
        "Portal updated, but could not sync with Netlify Identity."
      );
    }
  };

  const loadUsers = async () => {
    const data = await getAdminUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setIdentityStatus("");
    try {
      await addAdminUser({
        data: {
          email: email.trim(),
          name: name.trim() || undefined,
          role,
        },
      });
      await syncIdentityUser(email.trim(), name.trim() || undefined, "POST");
      setEmail("");
      setName("");
      setRole("reviewer");
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to add user");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number, adminEmail: string) => {
    if (adminEmail.toLowerCase() === user?.email?.toLowerCase()) {
      if (!confirm("Are you sure you want to remove yourself?")) {
        return;
      }
    }
    setIdentityStatus("");
    await removeAdminUser({ data: { id } });
    await syncIdentityUser(adminEmail, undefined, "DELETE");
    await loadUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Portal Users</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Invite User
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Add an email address to grant portal access. The user must also have a
          Netlify Identity account to log in.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-3">
            {error}
          </div>
        )}

        {identityStatus && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            {identityStatus}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Role:</span>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="reviewer"
                checked={role === "reviewer"}
                onChange={() => setRole("reviewer")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Reviewer
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Admin
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              {adding ? "Adding..." : "Invite User"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Portal Users ({users.length})
          </h2>
        </div>
        {users.length === 0 ? (
          <div className="p-5 text-center text-sm text-gray-500">
            No users configured.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {users.map((u) => (
              <li
                key={u.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    {u.role === "admin" ? (
                      <Shield className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {u.name || u.email}
                      {u.email.toLowerCase() ===
                        user?.email?.toLowerCase() && (
                        <span className="text-xs text-gray-400 ml-2">
                          (you)
                        </span>
                      )}
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Reviewer"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {u.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(u.id, u.email)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Remove user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Inviting a user here also sends them a Netlify
          Identity invite email to set up their account. Removing a user also
          removes their Identity account. Reviewers can view and edit
          applications but cannot manage users.
        </p>
      </div>
    </div>
  );
}
