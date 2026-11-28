import type { PhotoFrame } from "../data/model";

export function PhotoFrameField({
  value,
  onChange,
  fromLayout = false,
}: {
  value?: PhotoFrame;
  onChange: (value?: PhotoFrame) => void;
  fromLayout?: boolean;
}) {
  return (
    <label>
      Moldura da foto
      <select
        value={value ?? (fromLayout ? "" : "plain")}
        onChange={(event) =>
          onChange((event.target.value || undefined) as PhotoFrame | undefined)
        }
      >
        {fromLayout && <option value="">Do modelo da página</option>}
        <option value="plain">Sem moldura</option>
        <option value="polaroid">Polaroide</option>
        <option value="album">Borda branca</option>
        <option value="kraft">Papel kraft</option>
        <option value="film">Filme preto</option>
      </select>
    </label>
  );
}
