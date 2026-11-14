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
      <PageTitle eyebrow="SEU ESPAÇO, SUAS ESCOLHAS" title="Dados e ajustes">
        Nesta versão, seus dados ficam neste navegador. Não há conta nem
        sincronização com outros aparelhos.
      </PageTitle>
      <div className="settings-grid">
        <section className="surface">
          <HardDrive size={25} />
          <h2>Guarde uma cópia</h2>
          <p>
            O backup inclui seu mural, fotos da galeria, metas, ações e
            revisões. Mantenha o arquivo em um lugar seguro: ele contém seus
            dados e não é criptografado.
          </p>
          <button
            disabled={action.pending}
            onClick={() =>
              void action.run(
                () => exportBackup(store.data, store.repository),
                "Backup preparado para download.",
              )
            }
          >
            <Download size={17} /> Baixar backup completo
          </button>
          {estimate?.usage !== undefined && (
            <p className="small muted">
              Uso aproximado deste site: {mb(estimate.usage)}
              {estimate.quota
                ? ` de ${mb(estimate.quota)} disponíveis no navegador`
                : ""}
              .
            </p>
          )}
          <p className="small muted">
            Limpar os dados do navegador pode apagar seu progresso. A opção de
            armazenamento persistente ajuda, mas não substitui um backup.
          </p>
          <button
            className="text-button"
            disabled={action.pending}
            onClick={() =>
              void action.run(async () => {
                if (!navigator.storage?.persist)
                  throw new Error(
                    "Seu navegador não oferece essa opção. Mantenha um backup.",
                  );
                const granted = await navigator.storage.persist();
                if (!granted)
                  throw new Error(
                    "O navegador não concedeu armazenamento persistente. Você ainda pode usar o app e fazer backups.",
                  );
              }, "O navegador concedeu armazenamento persistente.")
            }
          >
            Solicitar armazenamento persistente
          </button>
        </section>
        <section className="surface">
          <Upload size={25} />
          <h2>Restaurar um backup</h2>
          <p>
            Importe uma cópia deste app para continuar em outro aparelho. A
            restauração substitui todos os dados locais.
          </p>
          <button
            className="secondary"
            disabled={action.pending}
            onClick={() => input.current?.click()}
          >
            <Upload size={17} /> Escolher backup
          </button>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label="Arquivo de backup"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void action.run(async () => {
                const result = await readBackup(file);
                if (
                  !confirm(
                    `Substituir seus dados por este backup com ${result.workspace.gallery.length} fotos, ${result.workspace.cards.length} recortes e ${result.workspace.goals.length} metas? Faça um backup atual antes de continuar.`,
                  )
                )
                  return;
                await store.replace(result.workspace, result.assets);
              }, "Operação finalizada. Seus dados atuais estão disponíveis no mural.");
            }}
          />
        </section>
        <section className="surface">
          <Smartphone size={25} />
          <h2>Leve seu mural com você</h2>
          <p>
            Instale pelo navegador para abrir como um app. Depois do primeiro
            carregamento completo, a interface e seus dados locais podem
            funcionar sem internet.
          </p>
          {installPrompt ? (
            <button onClick={onInstall}>Instalar no aparelho</button>
          ) : (
            <>
              <p className="small">
                No Android, procure “Instalar app” no menu do navegador. No
                iPhone, use Compartilhar → Adicionar à Tela de Início no Safari.
                A disponibilidade depende do navegador.
              </p>
              <p className="small muted">
                A instalação não cria uma conta e não sincroniza aparelhos.
              </p>
            </>
          )}
        </section>
        <section className="surface danger-zone">
          <Trash2 size={25} />
          <h2>Apagar dados deste navegador</h2>
          <p>
            Remove fotos, mural, metas e registros locais. Esta ação não pode
            ser desfeita sem um backup.
          </p>
          <button
            className="danger"
            disabled={action.pending}
            onClick={() => {
              if (
                !confirm(
                  "Apagar permanentemente todos os dados deste app neste navegador?",
                )
              )
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
        <h2>Sobre esta versão de teste</h2>
        <p>
          Para pessoas a partir de 16 anos. Os arquivos ficam no armazenamento
          deste site no seu navegador, sem proteção por senha do app. Outras
          pessoas com acesso ao mesmo perfil do navegador podem vê-los.
        </p>
        <p>
          Não há geração de IA, cobrança, publicidade ou envio das suas fotos a
          um servidor do produto nesta versão. O preço será definido depois dos
          testes. A hospedagem ainda pode registrar acessos técnicos.
        </p>
      </section>
    </>
  );
}
