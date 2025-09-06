"use client";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InboxPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="mt-20">
      <h1 className="text-3xl font-bold">Inbox</h1>
      <p className="mt-4">This is your inbox page.</p>
    </div>
  );
}
