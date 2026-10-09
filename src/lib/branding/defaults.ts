export interface BrandConfig {
  propertyName: string;
  propertyTagline: string;
  rentalArchetype?: "apartment" | "dormitory" | "boarding_house" | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  setupCompleted?: boolean;
  setupCompletedAt?: string | null;
}

export const DEFAULT_BRANDING: BrandConfig = {
  propertyName: "iReside Residences",
  propertyTagline: "Modern Property Management & Residential Operations",
  rentalArchetype: null,
  primaryColor: "#c4b0ff",
  secondaryColor: "#8b5cf6",
  logoUrl: null,
  bannerUrl: null,
  setupCompleted: false,
  setupCompletedAt: null,
};
