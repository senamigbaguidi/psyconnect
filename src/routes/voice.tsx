import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, PhoneOff, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/voice")({
  component: VoicePage,
});

type CallState = "idle" | "connecting" | "live" | "ended" | "error";

function VoicePage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [state, setState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  const cleanup = () => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  };

  useEffect(() => () => cleanup(), []);

  const start = async () => {
    setError(null);
    setState("connecting");
    try {
      // 1. Microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // 2. Get ephemeral token from our server
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const tokenRes = await fetch("/api/realtime-token", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!tokenRes.ok) {
        throw new Error(`Token error (${tokenRes.status})`);
      }
      const { clientSecret, endpoint } = (await tokenRes.json()) as {
        clientSecret: string;
        endpoint: string;
      };
      if (!clientSecret || !endpoint) {
        throw new Error("Réponse invalide du serveur");
      }

      // 3. WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => {
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
          audioRef.current.play().catch(() => {});
        }
      };
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (!sdpRes.ok) {
        const txt = await sdpRes.text().catch(() => "");
        throw new Error(`WebRTC handshake (${sdpRes.status}) ${txt.slice(0, 120)}`);
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setState("live");
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          setState("ended");
        }
      };
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Erreur de connexion");
      setState("error");
      cleanup();
      toast.error("Impossible de démarrer la conversation vocale.");
    }
  };

  const stop = () => {
    cleanup();
    setState("ended");
  };

  const toggleMute = () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[700px] opacity-70"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      />
      <SiteHeader />
      <main className="container mx-auto flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
            Conversation vocale
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
            Parlez. Je vous écoute.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Mode mains-libres avec PsyBot. Respiration, écoute, orientation.
          </p>

          {/* Visual orb */}
          <div className="relative mx-auto mt-12 h-56 w-56">
            <div
              aria-hidden
              className={`absolute inset-0 rounded-full blur-3xl transition-opacity ${
                state === "live" ? "opacity-80" : "opacity-30"
              }`}
              style={{ background: "var(--gradient-calm)" }}
            />
            <div
              aria-hidden
              className={`absolute inset-4 rounded-full bg-primary/20 backdrop-blur-xl transition-transform ${
                state === "live" ? "animate-pulse" : ""
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {state === "connecting" ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : state === "live" ? (
                <Volume2 className="h-14 w-14 text-primary" />
              ) : (
                <Mic className="h-14 w-14 text-primary" />
              )}
            </div>
          </div>

          <p className="mt-8 text-sm font-medium text-foreground" aria-live="polite">
            {state === "idle" && "Appuyez pour démarrer"}
            {state === "connecting" && "Connexion en cours…"}
            {state === "live" && "En direct — parlez librement"}
            {state === "ended" && "Conversation terminée"}
            {state === "error" && (error ?? "Erreur de connexion")}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            {state !== "live" && state !== "connecting" ? (
              <Button
                size="lg"
                onClick={start}
                className="h-14 rounded-full px-8 text-base shadow-[var(--shadow-calm)]"
              >
                <Mic className="mr-2 h-5 w-5" aria-hidden />
                {state === "ended" || state === "error"
                  ? "Reprendre"
                  : "Démarrer la conversation"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="lg"
                  variant={muted ? "default" : "outline"}
                  onClick={toggleMute}
                  aria-label={muted ? "Réactiver le micro" : "Couper le micro"}
                  className="h-14 w-14 rounded-full p-0"
                  disabled={state !== "live"}
                >
                  {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="destructive"
                  onClick={stop}
                  aria-label="Terminer la conversation"
                  className="h-14 w-14 rounded-full p-0"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Préférez-vous écrire ?{" "}
            <Link
              to="/chat"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Ouvrir le chat texte
            </Link>
          </p>

          <audio ref={audioRef} autoPlay className="sr-only" />
        </div>
      </main>
    </div>
  );
}