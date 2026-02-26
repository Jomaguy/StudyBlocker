export interface InstalledApp {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
}

export interface BlockedApp {
  packageName: string;
  appName: string;
  blockedSince: number;
}

export interface AccessGrant {
  packageName: string;
  grantedAt: number;
  expiresAt: number;
}

export interface PermissionStatus {
  hasUsageStats: boolean;
  hasOverlay: boolean;
  allGranted: boolean;
}
