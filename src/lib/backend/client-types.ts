export type BackendRealtimePayload = {
  payload?: unknown;
  new?: unknown;
  old?: unknown;
  eventType?: string;
};

export type BackendChannel = {
  on: (
    type: string,
    filter: unknown,
    callback?: (event: BackendRealtimePayload) => void,
  ) => BackendChannel;
  subscribe: (callback?: (status: string) => void) => BackendChannel;
  send: (payload: unknown) => Promise<"ok">;
};

export type AppSessionUser = {
  id: string;
  email?: string;
  is_anonymous?: false;
  app_metadata?: { provider?: string; roles?: string[] };
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string | null;
    picture?: string | null;
  };
};

export type AppSession = {
  user: AppSessionUser;
};

export type BackendClient = {
  auth: {
    getSession: () => Promise<{ data: { session: AppSession | null } }>;
    getUser: () => Promise<{ data: { user: AppSessionUser | null } }>;
    signOut: () => Promise<void>;
  };
  channel: (name: string) => BackendChannel;
  removeChannel: (channel: BackendChannel) => Promise<void>;
};

export type DutyChatContext = {
  dutyId: string;
  backend: BackendClient;
  currentUserId: string;
};

export type RideChatContext = {
  rideId: string;
  backend: BackendClient;
  currentUserId: string;
};
