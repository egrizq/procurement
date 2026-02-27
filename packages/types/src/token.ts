export interface ApiToken {
  id: number;
  userId: number;
  deviceName: string;
  deviceId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTokenRequest {
  device_name: string;
  device_id: string;
}

export interface CreateTokenResponse {
  token: string;
  expiresAt: Date;
}

export interface TokenInfo {
  id: number;
  deviceName: string;
  deviceId: string;
  expiresAt: Date;
  createdAt: Date;
}
