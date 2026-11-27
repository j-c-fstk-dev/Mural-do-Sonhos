import { useEffect, useState } from "react";
import type { Repository } from "./repository";

export function useAssetImage(assetId: string | null, repository: Repository) {
  const [image, setImage] = useState<{
    id: string;
    url: string;
    missing: boolean;
  } | null>(null);
  const url = image?.id === assetId ? image.url : "";
  const missing = image?.id === assetId && image.missing;
  useEffect(() => {
    if (!assetId) return;
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
  return { url, missing };
}
