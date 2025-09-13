"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Letter } from "@/types/letter";

interface Props {
  letter: Letter;
  onFinish: () => void;
}

export default function ScheduleSend({ letter, onFinish }: Props) {
  const [schedule, setSchedule] = useState(false);
  const [date, setDate] = useState("");

  async function handleSend() {
    await apiFetch(`/letter/${letter.id}/send`, {
      method: "POST",
      body: JSON.stringify({
        deliveryDate: schedule && date ? new Date(date).toISOString() : null,
      }),
    });
    onFinish();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Send Letter</h2>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={schedule}
          onChange={(e) => setSchedule(e.target.checked)}
        />
        Schedule send
      </label>

      {schedule && (
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-2 py-1"
        />
      )}

      <button
        onClick={handleSend}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {schedule ? "Schedule Letter" : "Send Now"}
      </button>
    </div>
  );
}
