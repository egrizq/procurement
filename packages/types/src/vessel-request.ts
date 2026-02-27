import type { RequestStatus, Priority, Unit } from './common.js';

export interface VesselRequestItem {
  id: number;
  vesselRequestId: number;
  itemId: number;
  qtyRequested: number;
  qtyApproved?: number | null;
  unit: Unit;
  status: RequestStatus;
  priority: Priority;
  justification?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VesselRequest {
  id: number;
  vesselId: number;
  userId: number;
  status: RequestStatus;
  priority: Priority;
  justification?: string | null;
  requestDate: Date;
  createdAt: Date;
  updatedAt: Date;
  items: VesselRequestItem[];
}

export interface CreateVesselRequestItem {
  itemId: number;
  qtyRequested: number;
  unit: Unit;
  status: RequestStatus;
  priority: Priority;
  justification?: string;
}

export interface CreateVesselRequest {
  vesselId: number;
  status: RequestStatus;
  priority: Priority;
  justification?: string;
  requestDate: string;
  items: CreateVesselRequestItem[];
}

export interface UpdateVesselRequestItem {
  itemId: number;
  qtyApproved: number;
  unit: Unit;
  status: RequestStatus;
  justification?: string;
}

export interface UpdateVesselRequest {
  vesselId: number;
  status: RequestStatus;
  items: UpdateVesselRequestItem[];
}
