"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";


export default function FunnelContactForm() {
  // Force German translations for iframe
  const { t } = useTranslation("de");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/funnel-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setStatus("Thank you! We will contact you soon.");
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
    } else {
      setStatus("Submission failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl bg-white p-12 
         mx-auto"
        style={{ fontFamily: "'SF Pro Display', Inter, sans-serif" }}
      >
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-[#222]">Basic Information</h2>
        <hr className="my-6 border-[#E5E7EB]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[15px] font-semibold mb-2">First Name</label>
            <input
              name="firstName"
              placeholder="Type your first name"
              value={form.firstName}
              onChange={handleChange}
              required
              className="w-full border border-[#E5E7EB] rounded-[6px] px-4 py-3 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2A36]"
            />
          </div>
          <div>
            <label className="block text-[15px] font-semibold mb-2">Last Name</label>
            <input
              name="lastName"
              placeholder="Type last name"
              value={form.lastName}
              onChange={handleChange}
              required
              className="w-full border border-[#E5E7EB] rounded-[6px] px-4 py-3 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2A36]"
            />
          </div>
          <div>
            <label className="block text-[15px] font-semibold mb-2">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="Type your email address"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-[#E5E7EB] rounded-[6px] px-4 py-3 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2A36]"
            />
          </div>
          <div>
            <label className="block text-[15px] font-semibold mb-2">Phone Number</label>
            <input
              name="phone"
              placeholder="Please Type your phone number"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full border border-[#E5E7EB] rounded-[6px] px-4 py-3 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2A36]"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-7 py-2 rounded-[6px] bg-[#222] text-white text-[15px] font-medium shadow-sm hover:bg-[#444] transition-colors duration-150 min-w-[140px]"
          >
            Send Request
          </button>
        </div>
        {status && (
          <div className="mt-2 text-center text-[#3B7A2A] font-medium">{status}</div>
        )}
      </form>
    </div>
  );
}
