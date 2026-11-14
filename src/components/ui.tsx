import { useEffect, useRef, type ReactNode } from "react";
import { X, LoaderCircle } from "lucide-react";
import type { Store } from "../data/useWorkspace";
import { useAction } from "../data/useAction";
import type { Workspace } from "../data/model";
export type ScreenProps = { store: Store & { data: Workspace } };
export function Feedback({ action }: { action: ReturnType<typeof useAction> }) {
  return (
    <>
      {action.error && (
        <p className="notice error" role="alert">
          {action.error}
        </p>
      )}
      {action.message && (
        <p className="notice success" role="status">
          {action.message}
        </p>
      )}
    </>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} aria-label={title}>
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar janela"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">✧</span>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
export function Submit({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button type="submit" disabled={pending}>
      {pending && <LoaderCircle size={17} className="spin" />}
      {pending ? "Salvando…" : children}
    </button>
  );
}
export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 tabIndex={-1}>{title}</h1>
      {children && <p className="page-subtitle">{children}</p>}
    </div>
  );
}
