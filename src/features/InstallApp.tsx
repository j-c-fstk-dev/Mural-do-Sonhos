import { Smartphone } from "lucide-react";
import type { useAppInstall } from "../pwa";

export function InstallApp({
  available,
  installed,
  status,
  install,
}: ReturnType<typeof useAppInstall>) {
  return (
    <section
      className="surface install-app"
      aria-labelledby="install-app-title"
    >
      <Smartphone size={25} aria-hidden="true" />
      <h2 id="install-app-title">Instalar o app</h2>
      <p>
        Instale pelo navegador para abrir o mural por um ícone. Depois do
        primeiro acesso com internet, ele também abre offline.
      </p>
      {installed ? (
        <p role="status">O Mural dos Sonhos está instalado neste aparelho.</p>
      ) : (
        <>
          {available && (
            <button type="button" onClick={() => void install()}>
              Instalar neste aparelho
            </button>
          )}
          {status === "pending" && (
            <p role="status">Confirme a instalação na janela do navegador.</p>
          )}
          {status === "accepted" && (
            <p role="status">
              Pedido aceito. Procure o ícone do Mural dos Sonhos no aparelho.
            </p>
          )}
          {status === "dismissed" && (
            <p role="status">
              Instalação cancelada. Você pode tentar pelo menu do navegador.
            </p>
          )}
          {status === "error" && (
            <p role="alert">
              Não deu para abrir a janela. Use o menu do navegador para
              instalar.
            </p>
          )}
          <p className="small muted">
            Escolha seu aparelho para ver os passos. A instalação começa no
            próprio site.
          </p>
        </>
      )}
      <details>
        <summary>Android · Chrome</summary>
        <ol>
          <li>Abra o Mural dos Sonhos no Chrome.</li>
          <li>
            Toque em <strong>⋮ → Instalar e criar atalho → Instalar</strong>.
          </li>
          <li>
            Se o seu Chrome mostrar <strong>Adicionar à tela inicial</strong>,
            escolha essa opção e depois <strong>Instalar</strong>.
          </li>
          <li>Confirme e abra o ícone na tela inicial.</li>
        </ol>
      </details>
      <details>
        <summary>iPhone e iPad · Safari</summary>
        <ol>
          <li>
            Abra o mural no Safari e toque em <strong>Compartilhar</strong>. Em
            algumas versões, ele fica no menu da página.
          </li>
          <li>
            Toque em <strong>Adicionar à Tela de Início</strong>. Se a opção não
            aparecer, procure em <strong>Editar ações</strong>.
          </li>
          <li>
            Se aparecer <strong>Abrir como App da Web</strong>, deixe ligado.
            Toque em <strong>Adicionar</strong>.
          </li>
        </ol>
      </details>
      <details>
        <summary>Computador · Chrome, Edge ou Safari</summary>
        <ul>
          <li>
            <strong>Chrome:</strong> clique no ícone de instalar na barra de
            endereço ou abra{" "}
            <strong>
              ⋮ → Transmitir, salvar e compartilhar → Instalar página como app
            </strong>
            .
          </li>
          <li>
            <strong>Edge:</strong> abra{" "}
            <strong>
              ⋯ → Mais ferramentas → Aplicativos → Instalar este site como um
              aplicativo
            </strong>
            . Em algumas versões, Aplicativos aparece direto no menu.
          </li>
          <li>
            <strong>Safari no Mac:</strong> a partir do macOS Sonoma, abra{" "}
            <strong>Arquivo → Adicionar ao Dock → Adicionar</strong>.
          </li>
        </ul>
      </details>
    </section>
  );
}
