import { useAction } from "../data/useAction";
import { useState } from "react";
import { Copy, WandSparkles } from "lucide-react";
import { Feedback, PageTitle, type ScreenProps } from "../components/ui";
export function Prompts({ store }: ScreenProps) {
  const [scene, setScene] = useState(store.data.dream.answers.scene || "");
  const [activity, setActivity] = useState("");
  const [feeling, setFeeling] = useState(
    store.data.dream.answers.feeling || "",
  );
  const [style, setStyle] = useState(
    "Fotografia natural, luz suave, cores acolhedoras",
  );
  const [withPerson, setWithPerson] = useState(false);
  const action = useAction();
  const prompt = `Crie uma imagem para um mural pessoal de sonhos.\nCena e ambiente: ${scene.trim() || "[descreva um lugar ou uma situação que deseja viver]"}.\nAtividade ou experiência: ${activity.trim() || "[descreva o que acontece nessa cena]"}.\nAtmosfera: ${feeling.trim() || "esperança, tranquilidade e possibilidades reais"}.\nEstilo visual: ${style.trim() || "fotografia natural"}.\n${withPerson ? "Se eu fornecer uma foto de referência e tiver autorização para usá-la, represente essa pessoa na cena, respeitando suas características." : "Não é necessário representar uma pessoa identificável."}\nComposição sem textos, logotipos ou marcas-d’água. A imagem representa uma possibilidade imaginada, não uma previsão.`;
  return (
    <>
      <PageTitle
        eyebrow="IDEIAS PARA O SEU MURAL"
        title="Crie uma imagem com IA"
      >
        Descreva uma imagem. Depois copie o pedido e cole em um app que crie
        imagens com IA.
      </PageTitle>
      <div className="prompt-layout">
        <section className="surface">
          <label>
            Onde a imagem acontece?
            <textarea
              maxLength={1000}
              rows={3}
              value={scene}
              onChange={(event) => setScene(event.target.value)}
              placeholder="Exemplo: uma praia com ondas pequenas"
            />
          </label>
          <label>
            O que aparece na imagem?
            <input
              maxLength={500}
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              placeholder="Exemplo: uma prancha azul na areia"
            />
          </label>
          <label>
            Que clima a imagem deve ter?
            <input
              maxLength={500}
              value={feeling}
              onChange={(event) => setFeeling(event.target.value)}
            />
          </label>
          <label>
            Estilo
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value)}
            >
              <option>Fotografia natural, luz suave, cores acolhedoras</option>
              <option>
                Colagem scrapbook, recortes de papel e tons pastéis
              </option>
              <option>
                Ilustração divertida, personagens simpáticos e cores suaves
              </option>
              <option>
                Fotografia editorial, composição limpa e detalhes realistas
              </option>
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={withPerson}
              onChange={(event) => setWithPerson(event.target.checked)}
            />{" "}
            Pedir para usar uma foto como exemplo
          </label>
          <p className="small muted">
            Leia as regras e veja o preço do outro app. Só use fotos que você
            tem permissão para usar.
          </p>
        </section>
        <section className="surface prompt-result">
          <WandSparkles size={25} />
          <h2>Seu pedido de imagem</h2>
          <textarea
            aria-label="Pedido pronto para copiar"
            readOnly
            rows={14}
            value={prompt}
          />
          <Feedback action={action} />
          <div className="inline-actions">
            <button
              onClick={() =>
                void action.run(
                  () => navigator.clipboard.writeText(prompt),
                  "Pedido copiado.",
                )
              }
            >
              <Copy size={17} /> Copiar pedido
            </button>
            <a href="#/">Voltar ao mural →</a>
          </div>
        </section>
      </div>
    </>
  );
}
