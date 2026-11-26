import { useEffect, useState } from "react";
import type { Repository } from "../data/repository";

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
  const [image, setImage] = useState<{
    id: string;
    url: string;
    missing: boolean;
  } | null>(null);
  const url = image?.id === assetId ? image.url : "";
  const missing = image?.id === assetId && image.missing;
  useEffect(() => {
    let live = true;
    let objectUrl = "";
    repository
      .asset(assetId)
      .then((asset) => {
        if (!live) return;
        if (!asset) {
          setImage({ id: assetId, url: "", missing: true });
          return;
        }
        objectUrl = URL.createObjectURL(asset.blob);
        setImage({ id: assetId, url: objectUrl, missing: false });
      })
      .catch(() => {
        if (live) setImage({ id: assetId, url: "", missing: true });
      });
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId, repository]);
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
