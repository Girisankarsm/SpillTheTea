"use client";

import { useState } from "react";
import { useVoiceCall } from "@/components/VoiceCallProvider";
import { unknownErrorMessage } from "@/lib/error-message";

type VoiceCallButtonProps = {
  roomId: string;
  roomLabel: string;
  peerUserId: string;
  peerName: string;
  callerName: string;
  className?: string;
};

export function VoiceCallButton({
  roomId,
  roomLabel,
  peerUserId,
  peerName,
  callerName,
  className = "",
}: VoiceCallButtonProps) {
  const { status, startCall } = useVoiceCall();
  const [busy, setBusy] = useState(false);
  const disabled = busy || status !== "idle";

  async function handleClick() {
    setBusy(true);
    try {
      await startCall({ roomId, roomLabel, peerUserId, peerName, callerName });
    } catch (e) {
      alert(unknownErrorMessage(e, "Could not start call."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled}
      title="Voice call"
      className={`rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-brand-soft disabled:opacity-50 ${className}`}
    >
      📞 Call
    </button>
  );
}
