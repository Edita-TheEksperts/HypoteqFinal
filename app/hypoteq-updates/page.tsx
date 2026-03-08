"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Interest {
  id: string;
  rate: number;
  position?: number;
}

export default function HypoteqUpdates() {
  const [interest, setInterest] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [modalValue, setModalValue] = useState<string>("");
  const [modalError, setModalError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/interest")
      .then(res => res.json())
      .then(data => {
        setInterest(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load interest rates");
        setLoading(false);
      });
  }, []);

  function openEditModal(id: string, rate: number) {
    setModalId(id);
    setModalValue((rate * 100).toFixed(2));
    setModalError("");
    setModalOpen(true);
  }

  async function handleModalSave() {
    if (!modalId) return;
    let value = modalValue.replace(",", ".");
    const floatVal = parseFloat(value);
    if (isNaN(floatVal) || floatVal < 0) {
      setModalError("Please enter a valid positive number");
      return;
    }
    // Convert percent to decimal
    const newRate = floatVal / 100;
    const res = await fetch(`/api/interest/${modalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate: newRate }),
    });
    if (res.ok) {
      setInterest(interest.map(i => i.id === modalId ? { ...i, rate: newRate } : i));
      setModalOpen(false);
    } else {
      setModalError("Update failed");
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setModalId(null);
    setModalValue("");
    setModalError("");
  }

  async function handleLogout() {
    await fetch("/api/admin-logout");
    router.push("/hypoteq-updates/login");
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#132219] font-sfpro">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600 font-sfpro">{error}</div>;

  // Static labels for positions (adjust as needed)
  const rateLabels = [
    "SARON ab",
    "1 Jahr ab",
    "2 Jahre ab",
    "3 Jahre ab",
    "4 Jahre ab",
    "5 Jahre ab",
    "6 Jahre ab",
    "7 Jahre ab",
    "8 Jahre ab",
    "9 Jahre ab",
    "10 Jahre ab"
  ];

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-[#132219] font-sfpro py-8 px-2">
      <div className="w-full max-w-lg flex flex-col items-center mb-8">
        <Image src="/images/HYPOTEQ_layout_logo_white.png" alt="Hypoteq Logo" width={200} height={48} className="mb-6" priority />
        <div className="w-full flex items-center justify-between mb-2 gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#CAF476] tracking-tight">Interest Rates Admin</h1>
          <button onClick={handleLogout} className="bg-[#CAF476] hover:bg-[#d6ff8a] text-[#132219] font-semibold px-5 py-2 rounded-full shadow transition">Logout</button>
        </div>
        <div className="w-full flex items-center justify-between mb-2 gap-2">
          <button
          type="button"
          className="w-full bg-[#CAF476] hover:bg-[#d6ff8a] text-[#132219] font-semibold p-3 rounded-full shadow transition text-lg mt-2"
          onClick={() => router.push('/hypoteq-updates/leads')}
        >
          Partner-Leads anzeigen
        </button>
        </div>
      </div>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-card p-4 sm:p-8 flex flex-col items-center">
        <table className="w-full text-left text-sm sm:text-base">
          <thead>
            <tr className="border-b border-[#132219]/20">
              <th className="py-2 px-2 font-semibold text-[#132219]">Label</th>
              <th className="py-2 px-2 font-semibold text-[#132219]">Rate</th>
              <th className="py-2 px-2 font-semibold text-[#132219]">Action</th>
            </tr>
          </thead>
          <tbody>
            {interest.map((i, idx) => (
              <tr key={i.id} className="border-b border-[#132219]/10 last:border-0 hover:bg-[#CAF476]/10 transition">
                <td className="py-2 px-2 font-medium text-[#132219]">{rateLabels[i.position ?? idx] || `Option ${idx+1}`}</td>
                <td className="py-2 px-2 text-[#132219]">{(i.rate * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => openEditModal(i.id, i.rate)}
                    className="bg-[#132219] hover:bg-[#294c2a] text-[#CAF476] px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition shadow"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for editing rate */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-card p-6 w-[90vw] max-w-xs flex flex-col items-center">
            <h3 className="text-lg font-bold text-[#132219] mb-2">Edit Rate</h3>
            <input
              type="number"
              step="0.01"
              min="0"
              value={modalValue}
              onChange={e => setModalValue(e.target.value)}
              className="border border-[#132219]/30 focus:border-[#CAF476] p-2 rounded w-full text-[#132219] placeholder:text-[#132219]/40 outline-none transition mb-2"
              placeholder="e.g. 0.90"
              autoFocus
            />
            <div className="text-xs text-[#132219] mb-2">Enter as percent (e.g. 0.90 for 0.90%)</div>
            {modalError && <div className="text-red-600 text-sm mb-2">{modalError}</div>}
            <div className="flex gap-2 w-full mt-2">
              <button onClick={handleModalClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-[#132219] font-semibold px-3 py-2 rounded-full transition">Cancel</button>
              <button onClick={handleModalSave} className="flex-1 bg-[#CAF476] hover:bg-[#d6ff8a] text-[#132219] font-semibold px-3 py-2 rounded-full transition">Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Global style for background */}
      <style jsx global>{`
        body { background: #132219 !important; }
      `}</style>
    </div>
  );
}
