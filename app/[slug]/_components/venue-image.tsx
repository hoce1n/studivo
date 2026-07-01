"use client";

import Image from "next/image";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type VenueImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  containerClassName?: string;
};

export function VenueImage({
  src,
  alt,
  fill = true,
  priority = false,
  sizes,
  className,
  containerClassName,
}: VenueImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 rounded-none" aria-hidden />
      )}
      {error ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted"
          role="img"
          aria-label={alt}
        >
          <span className="text-xs text-muted-foreground">تصویر در دسترس نیست</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      )}
    </div>
  );
}
