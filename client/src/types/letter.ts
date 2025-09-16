export interface Letter {
  id: string;
  authorId: string;
  recipientId: string;
  subject?: string;
  content: string;
  photoUrl?: string;
  songUrl?: string;
  status: "DRAFT" | "SCHEDULED" | "SENT" | "OPENED";
  createdAt: string;
  finishedAt?: string;
  deliveryDate?: string;
}
