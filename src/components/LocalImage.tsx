import type { Repository } from "../data/repository";
import { useAssetImage } from "../data/useAssetImage";

export function LocalImage({
  assetId,
  repository,
  alt,
  className = "",
}: {
  assetId: string;
  repository: Repository;
  alt: string;
  className?: string;
}) {
  const { url, missing } = useAssetImage(assetId, repository);
  return url ? (
    <img src={url} alt={alt} className={className} draggable={false} />
  ) : (
    <div
      className="image-placeholder"
      role="img"
      aria-label={missing ? "Imagem não encontrada" : "Carregando imagem"}
    >
      {missing ? "Imagem não encontrada" : "Carregando…"}
    </div>
  );
}
