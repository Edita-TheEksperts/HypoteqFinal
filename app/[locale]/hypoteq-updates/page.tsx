"use client";
import { useEffect, useState } from "react";

interface Interest {
  id: string;
  label: string;
  rate: number;
}
import { useRouter } from "next/navigation";

export default function HypoteqUpdates() {
  const [interest, setInterest] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  async function handleUpdate(id: string, rate: number) {
    const newRate = prompt("Enter new rate (e.g. 0.0129):", rate.toString());
    if (!newRate) return;
    const res = await fetch(`/api/interest/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate: parseFloat(newRate) }),
    });
    if (res.ok) {
      setInterest(interest.map(i => i.id === id ? { ...i, rate: parseFloat(newRate) } : i));
    } else {
      alert("Update failed");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin-logout");
    router.push("/hypoteq-updates/login");
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#132219] font-sfpro px-2 py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-card p-6 sm:p-8 flex flex-col gap-6">
        <button
          type="button"
          className="w-full bg-[#CAF476] hover:bg-[#d6ff8a] text-[#132219] font-semibold p-3 rounded-full shadow transition text-lg mt-2"
          onClick={() => router.push('/hypoteq-updates/leads')}
        >
          Partner-Leads anzeigen
        </button>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Interest Rates Admin</h1>
          
          <button onClick={handleLogout} className="bg-gray-700 text-white px-4 py-2 rounded">Logout</button>
        </div>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-2">Label</th>
              <th className="border p-2">Rate</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {interest.map((i: any) => (
              <tr key={i.id}>
                <td className="border p-2">{i.label}</td>
                <td className="border p-2">{i.rate}</td>
                <td className="border p-2">
                  <button onClick={() => handleUpdate(i.id, i.rate)} className="bg-green-600 text-white px-2 py-1 rounded">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
