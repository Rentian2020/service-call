import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  type QuerySnapshot,
  updateDoc,
  where,
  type Unsubscribe,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { ServiceRequest, ServiceRequestStatus } from "../types";

export const SERVICE_REQUESTS = "serviceRequests";

const toDate = (v: unknown): Date => {
  if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
};

const dataToRequest = (id: string, data: Record<string, unknown>): ServiceRequest => ({
  id,
  userId: String(data.userId ?? ""),
  providerId: String(data.providerId ?? "unassigned"),
  categoryId: String(data.categoryId ?? ""),
  description: String(data.description ?? ""),
  status: (data.status as ServiceRequestStatus) ?? "pending",
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
  scheduledAt: data.scheduledAt ? toDate(data.scheduledAt) : undefined,
  address: String(data.address ?? ""),
  estimatedCost: typeof data.estimatedCost === "number" ? data.estimatedCost : undefined,
  inspectionFee: typeof data.inspectionFee === "number" ? data.inspectionFee : undefined,
  quote: typeof data.quote === "number" ? data.quote : undefined,
  quoteAccepted: typeof data.quoteAccepted === "boolean" ? data.quoteAccepted : undefined,
  paymentStatus: data.paymentStatus as ServiceRequest["paymentStatus"],
  providerOwnerUid:
    data.providerOwnerUid === null || data.providerOwnerUid === undefined
      ? null
      : String(data.providerOwnerUid),
  capturedLocationLabel:
    typeof data.capturedLocationLabel === "string" ? data.capturedLocationLabel : undefined,
  requestLat: typeof data.requestLat === "number" ? data.requestLat : undefined,
  requestLng: typeof data.requestLng === "number" ? data.requestLng : undefined,
  urgency: data.urgency as ServiceRequest["urgency"],
  customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
  customerName: typeof data.customerName === "string" ? data.customerName : undefined,
});

const newRequestPayload = (r: ServiceRequest): Record<string, unknown> => {
  const out: Record<string, unknown> = {
    userId: r.userId,
    providerId: r.providerId,
    categoryId: r.categoryId,
    description: r.description,
    status: r.status,
    address: r.address,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (r.scheduledAt) out.scheduledAt = Timestamp.fromDate(r.scheduledAt);
  if (r.estimatedCost !== undefined) out.estimatedCost = r.estimatedCost;
  if (r.inspectionFee !== undefined) out.inspectionFee = r.inspectionFee;
  if (r.quote !== undefined) out.quote = r.quote;
  if (r.quoteAccepted !== undefined) out.quoteAccepted = r.quoteAccepted;
  if (r.paymentStatus !== undefined) out.paymentStatus = r.paymentStatus;
  if (r.providerOwnerUid !== undefined && r.providerOwnerUid !== null) {
    out.providerOwnerUid = r.providerOwnerUid;
  } else {
    out.providerOwnerUid = null;
  }
  if (r.capturedLocationLabel) out.capturedLocationLabel = r.capturedLocationLabel;
  if (r.requestLat !== undefined) out.requestLat = r.requestLat;
  if (r.requestLng !== undefined) out.requestLng = r.requestLng;
  if (r.urgency) out.urgency = r.urgency;
  if (r.customerEmail) out.customerEmail = r.customerEmail;
  if (r.customerName) out.customerName = r.customerName;
  return out;
};

export const createServiceRequest = async (r: ServiceRequest): Promise<string> => {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
  const ref = await addDoc(collection(db, SERVICE_REQUESTS), newRequestPayload(r));
  return ref.id;
};

const emitMerged = (sliceMaps: Map<string, Map<string, ServiceRequest>>) => {
  const flat = new Map<string, ServiceRequest>();
  for (const m of sliceMaps.values()) {
    for (const [k, v] of m) {
      flat.set(k, v);
    }
  }
  return Array.from(flat.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const subscribeServiceRequests = (
  userId: string,
  ownedProviderIds: string[],
  onUpdate: (requests: ServiceRequest[]) => void
): Unsubscribe => {
  if (!isFirebaseConfigured) {
    onUpdate([]);
    return () => {};
  }

  const sliceMaps = new Map<string, Map<string, ServiceRequest>>();
  const unsubs: Unsubscribe[] = [];

  const setSlice = (name: string, snap: QuerySnapshot) => {
    const m = new Map<string, ServiceRequest>();
    for (const d of snap.docs) {
      m.set(d.id, dataToRequest(d.id, d.data() as Record<string, unknown>));
    }
    sliceMaps.set(name, m);
    onUpdate(emitMerged(sliceMaps));
  };

  unsubs.push(
    onSnapshot(
      query(collection(db, SERVICE_REQUESTS), where("userId", "==", userId)),
      (snap) => setSlice("user", snap)
    )
  );

  unsubs.push(
    onSnapshot(
      query(
        collection(db, SERVICE_REQUESTS),
        where("providerId", "==", "unassigned"),
        where("status", "==", "pending")
      ),
      (snap) => setSlice("open", snap)
    )
  );

  for (let i = 0; i < ownedProviderIds.length; i += 10) {
    const chunk = ownedProviderIds.slice(i, i + 10);
    if (chunk.length === 0) continue;
    const idx = i;
    unsubs.push(
      onSnapshot(
        query(collection(db, SERVICE_REQUESTS), where("providerId", "in", chunk)),
        (snap) => setSlice(`prov-${idx}`, snap)
      )
    );
  }

  return () => {
    for (const u of unsubs) u();
  };
};

export const updateServiceRequestDocument = async (
  id: string,
  updates: Partial<ServiceRequest>
): Promise<void> => {
  if (!isFirebaseConfigured) return;
  const ref = doc(db, SERVICE_REQUESTS, id);
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (updates.userId !== undefined) payload.userId = updates.userId;
  if (updates.providerId !== undefined) payload.providerId = updates.providerId;
  if (updates.categoryId !== undefined) payload.categoryId = updates.categoryId;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.estimatedCost !== undefined) payload.estimatedCost = updates.estimatedCost;
  if (updates.inspectionFee !== undefined) payload.inspectionFee = updates.inspectionFee;
  if (updates.quote !== undefined) payload.quote = updates.quote;
  if (updates.quoteAccepted !== undefined) payload.quoteAccepted = updates.quoteAccepted;
  if (updates.paymentStatus !== undefined) payload.paymentStatus = updates.paymentStatus;
  if (updates.providerOwnerUid !== undefined) {
    payload.providerOwnerUid = updates.providerOwnerUid;
  }
  if (updates.capturedLocationLabel !== undefined) {
    payload.capturedLocationLabel = updates.capturedLocationLabel;
  }
  if (updates.requestLat !== undefined) payload.requestLat = updates.requestLat;
  if (updates.requestLng !== undefined) payload.requestLng = updates.requestLng;
  if (updates.urgency !== undefined) payload.urgency = updates.urgency;
  if (updates.customerEmail !== undefined) payload.customerEmail = updates.customerEmail;
  if (updates.customerName !== undefined) payload.customerName = updates.customerName;
  if (updates.scheduledAt !== undefined) {
    payload.scheduledAt = updates.scheduledAt ? Timestamp.fromDate(updates.scheduledAt) : null;
  }
  if (updates.createdAt !== undefined) {
    payload.createdAt = Timestamp.fromDate(updates.createdAt);
  }

  await updateDoc(ref, payload as DocumentData);
};
