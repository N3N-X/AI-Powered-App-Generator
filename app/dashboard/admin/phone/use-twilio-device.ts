"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Device, Call } from "@twilio/voice-sdk";

export function useTwilioDevice(onCallEnded?: () => void) {
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const [deviceReady, setDeviceReady] = useState(false);
  const [callState, setCallState] = useState<
    "idle" | "connecting" | "ringing" | "connected"
  >("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const initDevice = useCallback(async () => {
    if (deviceRef.current) return;
    try {
      const res = await fetch("/api/voice/token");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get token");
      }
      const { token } = await res.json();

      const device = new Device(token, {
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        closeProtection: true,
      });

      device.on("registered", () => setDeviceReady(true));
      device.on("error", (err) => {
        console.error("Twilio Device error:", err);
        setError(`Device error: ${err.message}`);
      });

      await device.register();
      deviceRef.current = device;
    } catch (err) {
      console.error("Failed to init Twilio Device:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize phone",
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const makeCall = useCallback(
    async (to: string) => {
      if (!to.trim()) return;

      if (!deviceRef.current) {
        await initDevice();
      }

      if (!deviceRef.current) {
        setError("Phone device not available. Check Twilio configuration.");
        return;
      }

      try {
        setCallState("connecting");
        const call = await deviceRef.current.connect({
          params: { To: to.trim() },
        });

        activeCallRef.current = call;

        call.on("ringing", () => setCallState("ringing"));
        call.on("accept", () => {
          setCallState("connected");
          setCallDuration(0);
          durationInterval.current = setInterval(() => {
            setCallDuration((d) => d + 1);
          }, 1000);
        });
        call.on("disconnect", () => {
          setCallState("idle");
          setIsMuted(false);
          activeCallRef.current = null;
          if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
          }
          onCallEnded?.();
        });
        call.on("cancel", () => {
          setCallState("idle");
          activeCallRef.current = null;
          if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
          }
        });
        call.on("error", (err) => {
          console.error("Call error:", err);
          setError(`Call error: ${err.message}`);
          setCallState("idle");
          activeCallRef.current = null;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to make call");
        setCallState("idle");
      }
    },
    [initDevice, onCallEnded],
  );

  const hangUp = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (activeCallRef.current) {
      const newMuted = !isMuted;
      activeCallRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  return {
    deviceReady,
    callState,
    isMuted,
    callDuration,
    error,
    setError,
    makeCall,
    hangUp,
    toggleMute,
  };
}
