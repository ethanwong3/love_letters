"use client";
import { useState } from "react";
import RecipientSearch from "./components/RecipientSearch";
import LetterEditor from "./components/LetterEditor";
import ScheduleSend from "./components/ScheduleSend";
import Confirmation from "./components/Confirmation";
import type { User } from "@/types/user";
import type { Letter } from "@/types/letter";

export default function WritePage() {
  const [step, setStep] = useState<"search" | "editor" | "schedule" | "done">(
    "search"
  );
  const [recipient, setRecipient] = useState<User | null>(null);
  const [letter, setLetter] = useState<Letter | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-8">
      {step === "search" && (
        <RecipientSearch
          onSelect={(user) => {
            setRecipient(user);
            setStep("editor");
          }}
        />
      )}
      {step === "editor" && recipient && (
        <LetterEditor
          recipient={recipient}
          onDraft={(draft) => {
            setLetter(draft);
            setStep("schedule");
          }}
        />
      )}
      {step === "schedule" && letter && (
        <ScheduleSend
          letter={letter}
          onFinish={() => setStep("done")}
        />
      )}
      {step === "done" && <Confirmation />}
    </div>
  );
}
