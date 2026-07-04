"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useBackend } from "@/components/BackendProvider";
import {
  ICE_SERVERS,
  roomCallChannel,
  userCallChannel,
  type ActiveCall,
  type VoiceCallSignal,
  type VoiceCallStatus,
} from "@/lib/voice-call/types";

type BackendChannel = {
  on: (
    type: string,
    filter: unknown,
    callback?: (event: { payload?: unknown }) => void,
  ) => BackendChannel;
  subscribe: (callback?: (status: string) => void) => BackendChannel | Promise<BackendChannel>;
  send: (payload: unknown) => Promise<unknown>;
};

type BackendClient = {
  channel: (name: string) => BackendChannel;
  removeChannel: (channel: BackendChannel) => Promise<void>;
};

type StartCallInput = {
  roomId: string;
  roomLabel: string;
  peerUserId: string;
  peerName: string;
  callerName: string;
};

type VoiceCallContextValue = {
  status: VoiceCallStatus;
  activeCall: ActiveCall | null;
  error: string | null;
  startCall: (input: StartCallInput) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  hangUp: () => void;
};

const VoiceCallContext = createContext<VoiceCallContextValue | null>(null);

function isVoiceSignal(payload: unknown): payload is VoiceCallSignal {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "type" in payload &&
    "roomId" in payload &&
    "fromUserId" in payload
  );
}

export function VoiceCallProvider({ children }: { children: ReactNode }) {
  const { backend, remoteReady, session } = useBackend();
  const userId = session?.user?.id ?? null;

  const [status, setStatus] = useState<VoiceCallStatus>("idle");
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const roomChannelRef = useRef<BackendChannel | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);
  const statusRef = useRef<VoiceCallStatus>("idle");
  const ringTimeoutRef = useRef<number | null>(null);
  const backendRef = useRef<BackendClient | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    backendRef.current = backend;
  }, [backend]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const cleanupCall = useCallback(() => {
    if (ringTimeoutRef.current) {
      window.clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    const sb = backendRef.current;
    if (roomChannelRef.current && sb) {
      void sb.removeChannel(roomChannelRef.current);
      roomChannelRef.current = null;
    }

    setStatus("idle");
    setActiveCall(null);
    setError(null);
  }, []);

  const sendRoomSignal = useCallback(async (signal: VoiceCallSignal) => {
    if (!roomChannelRef.current) return;
    await roomChannelRef.current.send({
      type: "broadcast",
      event: "voice-signal",
      payload: signal,
    });
  }, []);

  const sendUserSignal = useCallback(async (toUserId: string, signal: VoiceCallSignal) => {
    const sb = backendRef.current;
    if (!sb) return;
    const channel = sb.channel(userCallChannel(toUserId));
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "voice-signal",
      payload: signal,
    });
    void sb.removeChannel(channel);
  }, []);

  const ensureLocalAudio = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const handleRoomSignal = useCallback(
    async (signal: VoiceCallSignal) => {
      const call = activeCallRef.current;
      const uid = userIdRef.current;
      if (!call || signal.roomId !== call.roomId || !uid) return;
      if (signal.fromUserId === uid) return;

      if (signal.type === "accept" && call.direction === "outgoing") {
        setStatus("connecting");
        try {
          const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
          pcRef.current = pc;
          pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            void sendRoomSignal({
              type: "ice",
              roomId: call.roomId,
              fromUserId: uid,
              candidate: event.candidate.toJSON(),
            });
          };
          pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (remoteAudioRef.current && stream) {
              remoteAudioRef.current.srcObject = stream;
              void remoteAudioRef.current.play().catch(() => undefined);
            }
          };
          pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") setStatus("connected");
            if (pc.connectionState === "failed") {
              setError("Call connection lost.");
            }
          };

          const stream = await ensureLocalAudio();
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendRoomSignal({
            type: "offer",
            roomId: call.roomId,
            fromUserId: uid,
            sdp: offer,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not start call.");
          cleanupCall();
        }
        return;
      }

      if (signal.type === "reject" && call.direction === "outgoing") {
        setError("Call declined.");
        cleanupCall();
        return;
      }

      if (signal.type === "offer" && call.direction === "incoming") {
        setStatus("connecting");
        try {
          const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
          pcRef.current = pc;
          pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            void sendRoomSignal({
              type: "ice",
              roomId: call.roomId,
              fromUserId: uid,
              candidate: event.candidate.toJSON(),
            });
          };
          pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (remoteAudioRef.current && stream) {
              remoteAudioRef.current.srcObject = stream;
              void remoteAudioRef.current.play().catch(() => undefined);
            }
          };
          pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") setStatus("connected");
          };

          const stream = await ensureLocalAudio();
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          await pc.setRemoteDescription(signal.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendRoomSignal({
            type: "answer",
            roomId: call.roomId,
            fromUserId: uid,
            sdp: answer,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not answer call.");
          cleanupCall();
        }
        return;
      }

      if (signal.type === "answer" && call.direction === "outgoing") {
        try {
          const pc = pcRef.current;
          if (!pc) return;
          await pc.setRemoteDescription(signal.sdp);
          setStatus("connected");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not connect call.");
          cleanupCall();
        }
        return;
      }

      if (signal.type === "ice") {
        try {
          const pc = pcRef.current;
          if (!pc || !signal.candidate) return;
          await pc.addIceCandidate(signal.candidate);
        } catch {
          /* ignore */
        }
        return;
      }

      if (signal.type === "hangup") {
        cleanupCall();
      }
    },
    [cleanupCall, ensureLocalAudio, sendRoomSignal],
  );

  const handleRoomSignalRef = useRef(handleRoomSignal);
  useEffect(() => {
    handleRoomSignalRef.current = handleRoomSignal;
  }, [handleRoomSignal]);

  const attachRoomChannel = useCallback((call: ActiveCall) => {
    const sb = backendRef.current;
    if (!sb) return;

    if (roomChannelRef.current) {
      void sb.removeChannel(roomChannelRef.current);
    }

    const channel = sb
      .channel(roomCallChannel(call.roomId))
      .on("broadcast", { event: "voice-signal" }, ({ payload }) => {
        if (!isVoiceSignal(payload)) return;
        void handleRoomSignalRef.current(payload);
      })
      .subscribe();

    roomChannelRef.current = channel;
  }, []);

  const hangUp = useCallback(() => {
    const call = activeCallRef.current;
    const uid = userIdRef.current;
    if (call && uid) {
      void sendRoomSignal({
        type: "hangup",
        roomId: call.roomId,
        fromUserId: uid,
      });
    }
    cleanupCall();
  }, [cleanupCall, sendRoomSignal]);

  const startCall = useCallback(
    async (input: StartCallInput) => {
      const sb = backendRef.current;
      const uid = userIdRef.current;
      if (!sb || !uid) throw new Error("Sign in to call.");
      if (statusRef.current !== "idle") throw new Error("Already in a call.");
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Voice calls are not supported in this browser.");
      }

      const call: ActiveCall = {
        roomId: input.roomId,
        roomLabel: input.roomLabel,
        peerUserId: input.peerUserId,
        peerName: input.peerName,
        direction: "outgoing",
      };

      setActiveCall(call);
      setStatus("calling");
      setError(null);
      attachRoomChannel(call);

      await sendUserSignal(input.peerUserId, {
        type: "ring",
        roomId: input.roomId,
        roomLabel: input.roomLabel,
        fromUserId: uid,
        fromName: input.callerName,
      });

      ringTimeoutRef.current = window.setTimeout(() => {
        if (statusRef.current === "calling") {
          setError("No answer.");
          cleanupCall();
        }
      }, 45000);
    },
    [attachRoomChannel, cleanupCall, sendUserSignal],
  );

  const acceptCall = useCallback(async () => {
    const call = activeCallRef.current;
    const uid = userIdRef.current;
    if (!call || !uid) return;

    if (ringTimeoutRef.current) {
      window.clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    setStatus("connecting");
    attachRoomChannel(call);

    await sendRoomSignal({
      type: "accept",
      roomId: call.roomId,
      fromUserId: uid,
    });
  }, [attachRoomChannel, sendRoomSignal]);

  const rejectCall = useCallback(() => {
    const call = activeCallRef.current;
    const uid = userIdRef.current;
    if (call && uid) {
      void sendRoomSignal({
        type: "reject",
        roomId: call.roomId,
        fromUserId: uid,
      });
    }
    cleanupCall();
  }, [cleanupCall, sendRoomSignal]);

  useEffect(() => {
    if (!backend || !remoteReady || !userId) return;

    const channel = backend
      .channel(userCallChannel(userId))
      .on("broadcast", { event: "voice-signal" }, ({ payload }) => {
        if (!isVoiceSignal(payload) || payload.fromUserId === userId) return;

        if (payload.type === "ring") {
          if (statusRef.current !== "idle") {
            void sendUserSignal(payload.fromUserId, {
              type: "reject",
              roomId: payload.roomId,
              fromUserId: userId,
            });
            return;
          }

          setActiveCall({
            roomId: payload.roomId,
            roomLabel: payload.roomLabel,
            peerUserId: payload.fromUserId,
            peerName: payload.fromName,
            direction: "incoming",
          });
          setStatus("incoming");
          setError(null);
        }
      })
      .subscribe();

    return () => {
      void backend.removeChannel(channel);
    };
  }, [sendUserSignal, backend, remoteReady, userId]);

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return (
    <VoiceCallContext.Provider
      value={{
        status,
        activeCall,
        error,
        startCall,
        acceptCall,
        rejectCall,
        hangUp,
      }}
    >
      {children}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <VoiceCallOverlay
        status={status}
        activeCall={activeCall}
        error={error}
        onAccept={() => void acceptCall()}
        onReject={rejectCall}
        onHangUp={hangUp}
      />
    </VoiceCallContext.Provider>
  );
}

export function useVoiceCall() {
  const ctx = useContext(VoiceCallContext);
  if (!ctx) throw new Error("useVoiceCall must be used within VoiceCallProvider.");
  return ctx;
}

function VoiceCallOverlay({
  status,
  activeCall,
  error,
  onAccept,
  onReject,
  onHangUp,
}: {
  status: VoiceCallStatus;
  activeCall: ActiveCall | null;
  error: string | null;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
}) {
  if (status === "idle" && !error) return null;
  if (!activeCall && status === "idle") return null;

  const title =
    status === "incoming"
      ? "Incoming call"
      : status === "calling"
        ? "Calling…"
        : status === "connecting"
          ? "Connecting…"
          : status === "connected"
            ? "On call"
            : "Call ended";

  return (
    <div className="fixed inset-0 z-[800] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-wide text-brand">Voice call</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">{title}</h2>
        {activeCall ? (
          <p className="mt-1 text-sm text-subtle">
            {activeCall.peerName} · {activeCall.roomLabel}
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-danger-text">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {status === "incoming" ? (
            <>
              <button
                type="button"
                onClick={onReject}
                className="rounded-lg border border-danger-border bg-danger-bg px-4 py-2 text-sm font-bold text-danger-text"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white"
              >
                Accept
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onHangUp}
              className="rounded-lg border border-danger-border bg-danger-bg px-4 py-2 text-sm font-bold text-danger-text"
            >
              {status === "connected" ? "End call" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
