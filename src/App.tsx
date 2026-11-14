import { useAction } from "./data/useAction";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  ChevronRight,
  CloudOff,
  Compass,
  Images,
  LoaderCircle,
  Menu,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useWorkspace } from "./data/useWorkspace";
import { Feedback } from "./components/ui";
import { Mural } from "./features/Mural";
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
  { path: "/ajustes", name: "Dados e ajustes", icon: SettingsIcon },
];
function currentRoute() {
  return location.hash.slice(1) || "/";
}
function App() {
  const store = useWorkspace();
  const [route, setRoute] = useState(currentRoute);
  const [menu, setMenu] = useState(false);
  const [age, setAge] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );
  const action = useAction();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const navigate = () => {
      setRoute(currentRoute());
      setMenu(false);
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
      <header className="app-header">
        <a href="#/" className="brand">
          <span className="brand-symbol" aria-hidden="true">
            ✳︎
          </span>
          <span>
            Mural dos Sonhos<small>um espaço para o seu amanhã</small>
          </span>
        </a>
        <button
          className="icon-button mobile-menu"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menu}
          aria-controls="main-nav"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav
          id="main-nav"
          className={menu ? "open" : ""}
          aria-label="Navegação principal"
        >
          {routes.map((item) => (
            <a
              href={`#${item.path}`}
              key={item.path}
              className={route === item.path ? "active" : ""}
              aria-current={route === item.path ? "page" : undefined}
            >
              <item.icon size={17} />
              {item.name}
            </a>
          ))}
        </nav>
      </header>
      <div className="local-banner">
        <span>
          <CloudOff size={14} />
          {offline
            ? "Sem conexão · seu mural local continua disponível"
            : "Modo local · salvo neste navegador"}
        </span>
        <a href="#/ajustes">
          Fazer backup <ChevronRight size={13} />
        </a>
      </div>
      <main id="main" tabIndex={-1}>
        {store.error && (
          <p className="notice error" role="alert">
            {store.error}
          </p>
        )}
        {route === "/" ? (
          <Mural store={loaded} />
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
        <footer>
          <span>✳︎ Mural dos Sonhos · feito de possibilidades</span>
          <div>
            <a href="#/historico">Meu percurso</a>
            <a href="#/ajustes">Meus dados</a>
          </div>
        </footer>
      </main>
      {(needRefresh || offlineReady) && (
        <aside className="pwa-toast" role="status">
          <p>
            {needRefresh
              ? "Uma nova versão está disponível. Salve os formulários antes de atualizar."
              : "A interface está pronta para abrir sem conexão. Mantenha um backup dos seus dados."}
          </p>
          {needRefresh && (
            <button onClick={() => void updateServiceWorker(true)}>
              Atualizar
            </button>
          )}
          <button
            className="icon-button"
            aria-label="Fechar aviso"
            onClick={() => {
              setNeedRefresh(false);
              setOfflineReady(false);
            }}
          >
            <X size={17} />
          </button>
        </aside>
      )}
    </>
  );
}
export default App;
