"use client";
import { useEffect, useState } from "react";

interface FunnelLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  refSource?: string;
}

export default function PartnerLeads() {
  const [leads, setLeads] = useState<FunnelLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/funnel-lead")
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Fehler beim Laden der Leads");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#132219] font-sfpro">Lädt...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600 font-sfpro">{error}</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#132219] font-sfpro px-2 py-8">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-card p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#132219] mb-2 text-center tracking-tight">Partner-Leads</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#CAF476] text-[#132219]">
              <th className="p-2 text-left">Vorname</th>
              <th className="p-2 text-left">Nachname</th>
              <th className="p-2 text-left">Telefon</th>
              <th className="p-2 text-left">E-Mail</th>
              <th className="p-2 text-left">Partner/Quelle</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-[#E3F4BF]">
                <td className="p-2">{lead.firstName}</td>
                <td className="p-2">{lead.lastName}</td>
                <td className="p-2">{lead.phone}</td>
                <td className="p-2">{lead.email}</td>
                <td className="p-2">{lead.refSource || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
