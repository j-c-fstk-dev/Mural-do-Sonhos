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
        title="Dê uma imagem ao seu sonho."
      >
        Prepare um prompt, copie para uma ferramenta de imagens de sua escolha e
        depois envie o resultado para o mural.
      </PageTitle>
      <div className="prompt-layout">
        <section className="surface">
          <label>
            Que lugar ou situação você quer representar?
            <textarea
              maxLength={1000}
              rows={3}
              value={scene}
              onChange={(event) => setScene(event.target.value)}
              placeholder="Um ateliê iluminado com minhas criações…"
            />
          </label>
          <label>
            O que acontece nessa cena?
            <input
              maxLength={500}
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              placeholder="Trabalhando em um projeto autoral"
            />
          </label>
          <label>
            Que sensação a imagem deve transmitir?
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
            Incluir instrução para foto de referência
          </label>
          <p className="small muted">
            Este app não envia respostas ou fotos para geradores de imagens. Ao
            usar outra ferramenta, confira os termos, o preço e o tratamento das
            fotos. Use apenas imagens que você pode utilizar.
          </p>
        </section>
        <section className="surface prompt-result">
          <WandSparkles size={25} />
          <h2>Seu prompt</h2>
          <textarea
            aria-label="Prompt para copiar"
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
                  "Prompt copiado.",
                )
              }
            >
              <Copy size={17} /> Copiar prompt
            </button>
            <a href="#/">Voltar ao mural →</a>
          </div>
        </section>
      </div>
    </>
  );
}
