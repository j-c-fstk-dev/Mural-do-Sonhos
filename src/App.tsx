import { useAction } from "./data/useAction";
import { useCallback, useEffect, useState } from "react";
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
import { useAppInstall } from "./pwa";
import "./App.css";
const routes = [
  { path: "/", name: "Meu mural", icon: Images },
  { path: "/hoje", name: "Hoje", icon: CalendarCheck },
  { path: "/plano", name: "Metas e passos", icon: Compass },
  { path: "/revisao", name: "Minha semana", icon: Sparkles },
  { path: "/jornada", name: "Perguntas sobre meu sonho", icon: BookOpen },
  { path: "/historico", name: "O que já fiz", icon: HistoryIcon },
  { path: "/prompts", name: "Criar imagens com IA", icon: Lightbulb },
  { path: "/ajustes", name: "Cópias e ajustes", icon: SettingsIcon },
];
function currentRoute() {
  return location.hash.slice(1) || "/";
}
function App() {
  const store = useWorkspace();
  const [route, setRoute] = useState(currentRoute);
  const [menuChoice, setMenu] = useState<boolean | null>(null);
  const firstEditorVisit = store.data?.profile.editor_guide_seen === false;
  const menu =
    menuChoice ??
    (window.innerWidth > 900 || (route === "/" && firstEditorVisit));
  const requestedMenu = useCallback(() => setMenu(true), []);
  const [sidebar, setSidebar] = useState<HTMLDivElement | null>(null);
  const [replayTour, setReplayTour] = useState(false);
  function closeMobileSidebar() {
    if (window.innerWidth <= 900) setMenu(false);
  }
  const [age, setAge] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const appInstall = useAppInstall();
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
    window.addEventListener("hashchange", navigate);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
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
          <span className="eyebrow">MURAL DOS SONHOS</span>
          <h1 tabIndex={-1}>Monte um mural dos seus sonhos</h1>
          <p>Junte fotos, frases e figurinhas em um caderno feito por você.</p>
          <p className="small muted">
            Suas fotos e seus textos ficam neste navegador. Você pode guardar
            uma cópia nas configurações.
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
  const navLinks = routes.map((item) => (
    <a
      href={`#${item.path}`}
      key={item.path}
      onClick={closeMobileSidebar}
      aria-current={route === item.path ? "page" : undefined}
    >
      <item.icon size={17} /> {item.name}
    </a>
  ));
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
      <div className="book-shell" data-menu={menu} data-mural={route === "/"}>
        {menu && route !== "/" && (
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
          <details
            className="book-nav-group"
            open={window.innerWidth > 900 || route !== "/"}
          >
            <summary>Ir para outra parte do app</summary>
            <nav aria-label="Navegação principal">
              {navLinks.slice(0, 4)}
              <details
                className="book-nav-more"
                open={routes.slice(4).some((item) => item.path === route)}
              >
                <summary>Mais opções</summary>
                {navLinks.slice(4)}
              </details>
            </nav>
          </details>
          <button
            className="text-button book-tour-link"
            onClick={() => setReplayTour(true)}
          >
            <Sparkles size={16} /> Conhecer o app
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
              closeMobileSidebar={() => {
                if (!firstEditorVisit) closeMobileSidebar();
              }}
              openMenu={requestedMenu}
              rememberMenu={() => setMenu(menu)}
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
            <Settings store={loaded} appInstall={appInstall} />
          ) : (
            <section className="empty-state">
              <h1 tabIndex={-1}>Esta página não existe.</h1>
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
            Tem uma versão nova. Salve o que está escrevendo antes de atualizar.
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
