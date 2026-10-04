"use client";

import { useState } from "react";
import Image from "next/image";
import type { NFT } from "@/types/nft";
import { MetadataService } from "@/services/metadata/metadata-service";

interface NFTImageProps {
  nft: NFT;
  alt?: string;
  sizes?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

export function NFTImage(props: NFTImageProps) {
  const { nft } = props;
  return (
    <NFTImageWithFallback
      key={`${nft.imageUrl ?? ""}-${nft.contractAddress}-${nft.tokenId}`}
      {...props}
    />
  );
}

function NFTImageWithFallback({
  nft,
  alt,
  sizes,
  className,
  fill,
  width,
  height,
}: NFTImageProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidates = MetadataService.getImageCandidates(nft.imageUrl);
  const isFallback = candidateIndex >= candidates.length;
  const src =
    candidates[candidateIndex] ??
    MetadataService.getFallbackImage(nft.tokenId, nft.name);

  return (
    <Image
      src={src}
      alt={alt ?? nft.name ?? `Token #${nft.tokenId}`}
      sizes={sizes}
      className={className}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      unoptimized
      onError={() => {
        if (!isFallback) setCandidateIndex((index) => index + 1);
      }}
    />
  );
}
