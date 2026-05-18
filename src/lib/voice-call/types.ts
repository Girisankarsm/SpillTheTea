export type VoiceCallSignal =
  | {
      type: "ring";
      roomId: string;
      roomLabel: string;
      fromUserId: string;
      fromName: string;
    }
  | {
      type: "accept";
      roomId: string;
      fromUserId: string;
    }
  | {
      type: "reject";
      roomId: string;
      fromUserId: string;
    }
  | {
      type: "offer";
      roomId: string;
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "answer";
      roomId: string;
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice";
      roomId: string;
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }
  | {
      type: "hangup";
      roomId: string;
      fromUserId: string;
    };

export type VoiceCallStatus =
  | "idle"
  | "calling"
  | "incoming"
  | "connecting"
  | "connected";

export type ActiveCall = {
  roomId: string;
  roomLabel: string;
  peerUserId: string;
  peerName: string;
  direction: "outgoing" | "incoming";
};

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function userCallChannel(userId: string): string {
  return `voice-call-user:${userId}`;
}

export function roomCallChannel(roomId: string): string {
  return `voice-call:${roomId}`;
}
