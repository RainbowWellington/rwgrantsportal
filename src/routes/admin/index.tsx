import { createFileRoute } from "@tanstack/react-router";
import { getApplicationStats } from "../../server/applications.js";
import { getServerUser } from "../../lib/auth.js";
import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApplicationStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: FileText,
      color: "bg-indigo-500",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Clock,
      color: "bg-blue-500",
    },
    {
      label: "Under Review",
      value: stats.underReview,
      icon: AlertCircle,
      color: "bg-yellow-500",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      label: "Declined",
      value: stats.declined,
      icon: XCircle,
      color: "bg-red-500",
    },
    {
      label: "Total Requested",
      value: `$${stats.totalRequested.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div
              className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}
            >
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.total === 0 && (
        <div className="mt-8 text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No applications yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Applications will appear here once submitted through the public
            form.
          </p>
        </div>
      )}
    </div>
  );
}
