import type { DonationStatus } from "../backend.d";

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  accepted: {
    label: "Accepted",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function StatusBadge({ status }: { status: DonationStatus }) {
  const key = Object.keys(status)[0] as keyof typeof statusConfig;
  const config = statusConfig[key] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        config.className
      }`}
    >
      {config.label}
    </span>
  );
}

export function getStatusKey(status: DonationStatus) {
  return Object.keys(status)[0] as
    | "pending"
    | "accepted"
    | "delivered"
    | "rejected";
}
