export type RideLiveLocation = {
  rideId: string;
  userId: string;
  role: "rider" | "driver";
  lat: number;
  lng: number;
  sharing: boolean;
  updatedAt: number;
};

export type RideLiveLocations = {
  rider: RideLiveLocation | null;
  driver: RideLiveLocation | null;
};
