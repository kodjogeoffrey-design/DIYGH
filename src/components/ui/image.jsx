import * as React from "react";
import { placeholderImage } from "@/lib/product-image";
import { assetUrl } from "@/lib/asset";

/**
 * Plain <img> wrapper with a generated blueprint fallback. Handles missing
 * sources and failed loads so product tiles never show a broken-image icon.
 *
 * @param {{
 *   src?: string,
 *   alt?: string,
 *   className?: string,
 *   onError?: (event: any) => void,
 *   loading?: "lazy" | "eager",
 *   [key: string]: any,
 * }} props
 */
export function Image({ src, alt = "", className, onError, loading = "lazy", ...props }) {
  const [failed, setFailed] = React.useState(false);
  const resolved = src && !failed ? assetUrl(src) : placeholderImage();

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={loading}
      onError={(event) => {
        if (!failed) setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
