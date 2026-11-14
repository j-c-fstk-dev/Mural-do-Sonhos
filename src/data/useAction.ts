import { useState } from "react";
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function run(work: () => Promise<unknown>, success = "") {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await work();
      setMessage(success);
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir. Tente novamente.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }
  return { pending, error, message, run };
}
