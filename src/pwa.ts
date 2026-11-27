import { useEffect, useState } from "react";

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallStatus = "idle" | "pending" | "accepted" | "dismissed" | "error";

function isAppWindow() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useAppInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(isAppWindow);
  const [status, setStatus] = useState<InstallStatus>("idle");

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const markInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setStatus("idle");
    };
    const checkDisplayMode = () => {
      if (isAppWindow()) markInstalled();
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    displayMode.addEventListener("change", checkDisplayMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
      displayMode.removeEventListener("change", checkDisplayMode);
    };
  }, []);

  async function install() {
    if (!prompt || installed || status === "pending") return;
    setPrompt(null);
    setStatus("pending");
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      setStatus(outcome);
    } catch {
      setStatus("error");
    }
  }

  return { available: !!prompt && !installed, installed, status, install };
}
