import { useAction } from "./data/useAction";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  ChevronRight,
  CloudOff,
  Compass,
  Images,
  LoaderCircle,
  PanelLeft,
  BookOpen,
  History as HistoryIcon,
  Lightbulb,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useWorkspace } from "./data/useWorkspace";
import { Feedback } from "./components/ui";
import { Book } from "./features/Book";
import { Tour } from "./features/Tour";
import "./Book.css";
import { Journey } from "./features/Journey";
import { Plan } from "./features/Plan";
import { History, Today } from "./features/Today";
import { Review } from "./features/Review";
import { Prompts } from "./features/Prompts";
import { Settings } from "./features/Settings";
import type { InstallPrompt } from "./pwa";
import "./App.css";
const routes = [
  { path: "/", name: "Meu mural", icon: Images },
  { path: "/hoje", name: "Hoje", icon: CalendarCheck },
  { path: "/plano", name: "Meu caminho", icon: Compass },
  { path: "/revisao", name: "Revisão", icon: Sparkles },
  { path: "/jornada", name: "Percurso guiado", icon: BookOpen },
  { path: "/historico", name: "Histórico", icon: HistoryIcon },
  { path: "/prompts", name: "Ideias para imagens", icon: Lightbulb },
  { path: "/ajustes", name: "Dados e ajustes", icon: SettingsIcon },
];
function currentRoute() {
  return location.hash.slice(1) || "/";
}
function App() {
  const store = useWorkspace();
  const [route, setRoute] = useState(currentRoute);
  const [menu, setMenu] = useState(() => window.innerWidth > 900);
  const [sidebar, setSidebar] = useState<HTMLDivElement | null>(null);
  const [replayTour, setReplayTour] = useState(false);
  function closeMobileSidebar() {
    if (window.innerWidth <= 900) setMenu(false);
  }
  const [age, setAge] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );
  const action = useAction();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const navigate = () => {
      setRoute(currentRoute());
      closeMobileSidebar();
      window.scrollTo(0, 0);
    };
    const online = () => setOffline(!navigator.onLine);
    const install = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("hashchange", navigate);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    window.addEventListener("beforeinstallprompt", install);
    return () => {
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      window.removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    document.title = `${routes.find((item) => item.path === route)?.name || "Seu espaço"} · Mural dos Sonhos`;
    const timer = setTimeout(
      () =>
        document
          .querySelector<HTMLElement>("main h1")
          ?.focus({ preventScroll: true }),
      100,
    );
    return () => clearTimeout(timer);
  }, [route, store.data?.profile.age_confirmed]);
  async function install() {
    if (!installPrompt) return;
    await action.run(async () => {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    });
  }
  if (!store.data)
    return (
      <main className="loading-screen">
        <Sparkles size={38} />
        <h1>Mural dos Sonhos</h1>
        {store.error ? (
          <p className="notice error" role="alert">
            {store.error}
          </p>
        ) : (
          <p>
            <LoaderCircle size={18} className="spin" /> Abrindo seu espaço…
          </p>
        )}
      </main>
    );
  const loaded = { ...store, data: store.data };
  if (!store.data.profile.age_confirmed)
    return (
      <main className="age-screen">
        <div className="age-art" aria-hidden="true">
          <span>✳︎</span>
          <div>
            Um lugar para
            <br />
            os seus <em>sonhos.</em>
          </div>
          <small>recorte, imagine, construa ♡</small>
        </div>
        <section>
          <span className="eyebrow">MURAL DOS SONHOS · PRÉVIA LOCAL</span>
          <h1 tabIndex={-1}>
            Seu futuro merece
            <br />
            um espaço só seu.
          </h1>
          <p>
            Escolha um layout, adicione suas fotos e monte seu mural. Rápido,
            simples e com a sua cara.
          </p>
          <p className="small muted">
            Nesta versão, fotos e textos ficam somente neste navegador, sem
            conta ou senha. Use em um aparelho de confiança e guarde um backup.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action.run(() =>
                store.mutate((data) => {
                  data.profile.age_confirmed = true;
                }),
              );
            }}
          >
            <label className="check-label">
              <input
                type="checkbox"
                required
                checked={age}
                onChange={(event) => setAge(event.target.checked)}
              />{" "}
              Tenho 16 anos ou mais.
            </label>
            <button disabled={!age || action.pending}>
              Montar meu mural <ChevronRight size={18} />
            </button>
            <Feedback action={action} />
          </form>
        </section>
      </main>
    );
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.querySelector<HTMLElement>("#main")?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <header className="book-header">
        <button
          className="icon-button"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menu}
          aria-controls="book-sidebar"
          onClick={() => setMenu(!menu)}
        >
          <PanelLeft size={22} />
        </button>
        <a href="#/" className="brand">
          <span className="brand-symbol" aria-hidden="true">
            ✳︎
          </span>{" "}
          Mural dos Sonhos
        </a>
        <span className="book-local" title="Os dados ficam neste navegador">
          <CloudOff size={15} />{" "}
          {offline ? "Sem conexão" : "Salvo neste navegador"}
        </span>
      </header>
      <div className="book-shell" data-menu={menu}>
        {menu && (
          <button
            className="book-backdrop"
            aria-label="Fechar barra lateral"
            onClick={() => setMenu(false)}
          />
        )}
        <aside
          id="book-sidebar"
          className="book-sidebar"
          hidden={!menu}
          aria-label="Menu e biblioteca"
        >
          <nav aria-label="Navegação principal">
            {routes.map((item) => (
              <a
                href={`#${item.path}`}
                key={item.path}
                onClick={closeMobileSidebar}
                aria-current={route === item.path ? "page" : undefined}
              >
                <item.icon size={17} /> {item.name}
              </a>
            ))}
          </nav>
          <button
            className="text-button book-tour-link"
            onClick={() => setReplayTour(true)}
          >
            <Sparkles size={16} /> Ver tour do app
          </button>
          <div ref={setSidebar} className="book-library" />
        </aside>
        <main
          className={route === "/" ? "book-main book-main-editor" : "book-main"}
          id="main"
          tabIndex={-1}
        >
          {store.error && (
            <p className="notice error" role="alert">
              {store.error}
            </p>
          )}
          {route === "/" ? (
            <Book
              store={loaded}
              sidebar={sidebar}
              closeMobileSidebar={closeMobileSidebar}
              tourSeen={store.data.profile.tour_seen && !replayTour}
            />
          ) : route === "/hoje" ? (
            <Today store={loaded} />
          ) : route === "/plano" ? (
            <Plan store={loaded} />
          ) : route === "/jornada" ? (
            <Journey store={loaded} />
          ) : route === "/revisao" ? (
            <Review store={loaded} />
          ) : route === "/historico" ? (
            <History store={loaded} />
          ) : route === "/prompts" ? (
            <Prompts store={loaded} />
          ) : route === "/ajustes" ? (
            <Settings
              store={loaded}
              installPrompt={installPrompt}
              onInstall={() => void install()}
            />
          ) : (
            <section className="empty-state">
              <h1 tabIndex={-1}>Esse recorte ainda não existe.</h1>
              <a href="#/">Voltar ao mural</a>
            </section>
          )}
        </main>
      </div>
      {(!store.data.profile.tour_seen || replayTour) && (
        <Tour
          onFinish={async () => {
            await store.mutate((data) => {
              data.profile.tour_seen = true;
            });
            setReplayTour(false);
          }}
        />
      )}
      {needRefresh && (
        <aside className="pwa-toast" role="status">
          <p>
            Uma nova versão está disponível. Salve os formulários antes de
            atualizar.
          </p>
          <button onClick={() => void updateServiceWorker(true)}>
            Atualizar
          </button>
          <button
            className="icon-button"
            aria-label="Fechar aviso"
            onClick={() => setNeedRefresh(false)}
          >
            <X size={17} />
          </button>
        </aside>
      )}
    </>
  );
}
export default App;
