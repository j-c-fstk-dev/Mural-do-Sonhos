import { useAction } from "../data/useAction";
import { useEffect, useRef, useState } from "react";
import { Download, HardDrive, Smartphone, Trash2, Upload } from "lucide-react";
import { exportBackup, readBackup } from "../data/media";
import { Feedback, PageTitle, type ScreenProps } from "../components/ui";
import type { InstallPrompt } from "../pwa";
export function Settings({
  store,
  installPrompt,
  onInstall,
}: ScreenProps & {
  installPrompt: InstallPrompt | null;
  onInstall: () => void;
}) {
  const action = useAction();
  const input = useRef<HTMLInputElement>(null);
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then(setEstimate)
      .catch(() => {});
  }, [store.data]);
  const mb = (value: number) => `${(value / 1024 / 1024).toFixed(1)} MB`;
  return (
    <>
      <PageTitle eyebrow="SEUS ARQUIVOS" title="Cópias e ajustes">
        Seu mural fica neste navegador. Para abrir em outro aparelho, guarde uma
        cópia.
      </PageTitle>
      <div className="settings-grid">
        <section className="surface">
          <HardDrive size={25} />
          <h2>Guardar uma cópia</h2>
          <p>
            A cópia leva suas páginas, fotos, metas e anotações. Guarde o
            arquivo em um lugar seguro. Qualquer pessoa com o arquivo pode abrir
            a cópia.
          </p>
          <button
            disabled={action.pending}
            onClick={() =>
              void action.run(
                () => exportBackup(store.data, store.repository),
                "Sua cópia está pronta.",
              )
            }
          >
            <Download size={17} /> Baixar cópia completa
          </button>
          {estimate?.usage !== undefined && (
            <p className="small muted">
              Espaço usado pelo app: {mb(estimate.usage)}
              {estimate.quota
                ? ` de ${mb(estimate.quota)} disponíveis no navegador`
                : ""}
              .
            </p>
          )}
          <p className="small muted">
            Se limpar os dados do navegador, você pode perder seu mural. Guarde
            uma cópia para poder abrir de novo.
          </p>
          <button
            className="text-button"
            disabled={action.pending}
            onClick={() =>
              void action.run(async () => {
                if (!navigator.storage?.persist)
                  throw new Error(
                    "Seu navegador não tem essa opção. Você ainda pode baixar uma cópia.",
                  );
                const granted = await navigator.storage.persist();
                if (!granted)
                  throw new Error(
                    "O navegador não aceitou o pedido. Você ainda pode baixar uma cópia.",
                  );
              }, "O navegador aceitou proteger os arquivos.")
            }
          >
            Pedir proteção para os arquivos
          </button>
        </section>
        <section className="surface">
          <Upload size={25} />
          <h2>Abrir uma cópia antiga</h2>
          <p>
            Escolha uma cópia que você baixou. Ela vai substituir tudo que está
            salvo neste navegador.
          </p>
          <button
            className="secondary"
            disabled={action.pending}
            onClick={() => input.current?.click()}
          >
            <Upload size={17} /> Escolher arquivo
          </button>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label="Arquivo da cópia"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void action.run(async () => {
                const result = await readBackup(file);
                if (
                  !confirm(
                    "Abrir esta cópia e trocar tudo que está salvo aqui? Você pode baixar uma cópia dos dados atuais antes de continuar.",
                  )
                )
                  return;
                await store.replace(result.workspace, result.assets);
              }, "Cópia aberta. Seu mural está pronto.");
            }}
          />
        </section>
        <section className="surface">
          <Smartphone size={25} />
          <h2>Instalar o app</h2>
          <p>
            Depois de abrir o mural pela primeira vez, você pode usar o app
            mesmo sem internet.
          </p>
          {installPrompt ? (
            <button onClick={onInstall}>Instalar app</button>
          ) : (
            <>
              <p className="small">
                No Android, procure “Instalar app” no menu do navegador. No
                iPhone, use Compartilhar → Adicionar à Tela de Início no Safari.
                A disponibilidade depende do navegador.
              </p>
            </>
          )}
        </section>
        <section className="surface danger-zone">
          <Trash2 size={25} />
          <h2>Apagar tudo deste navegador</h2>
          <p>
            Isso apaga as páginas, fotos, metas e anotações. Guarde uma cópia se
            quiser abrir o mural de novo.
          </p>
          <button
            className="danger"
            disabled={action.pending}
            onClick={() => {
              if (!confirm("Apagar tudo que você guardou neste navegador?"))
                return;
              void action
                .run(() => store.clear())
                .then((ok) => {
                  if (ok) location.hash = "/";
                });
            }}
          >
            <Trash2 size={17} /> Apagar todos os dados
          </button>
        </section>
      </div>
      <Feedback action={action} />
      <section className="surface">
        <h2>Sobre o app</h2>
        <p>
          Para pessoas a partir de 16 anos. O app não pede senha. Quem usa o
          mesmo perfil do navegador pode ver o que você fez.
        </p>
        <p>
          Suas fotos ficam no aparelho. Esta versão é grátis e não tem anúncios.
          O serviço que mantém o site no ar pode registrar visitas.
        </p>
      </section>
    </>
  );
}
