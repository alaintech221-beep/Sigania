/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RoadSign } from '../types/signs';
import { ImageOff, Loader2 } from 'lucide-react';
import {
  getCachedSignUrl,
  saveWorkingSignUrl,
  generateCandidateUrls,
  searchWikimediaForSign,
} from '../utils/signImageResolver';

interface SignImageProps {
  sign: Pick<RoadSign, 'code' | 'nom'> & Partial<RoadSign>;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export const SignImage: React.FC<SignImageProps> = ({
  sign,
  className = 'w-full h-full flex items-center justify-center',
  imageClassName = 'max-w-full max-h-full object-contain filter drop-shadow-sm',
  fallbackClassName,
}) => {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [hasTriedSearch, setHasTriedSearch] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize candidates and URL when sign changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setHasTriedSearch(false);
    setIsSearchingApi(false);

    // Direct render for inline SVG data URIs (Feux, Marquage, Gestes)
    if (sign.imageUrl && sign.imageUrl.startsWith('data:')) {
      setCandidates([sign.imageUrl]);
      setCurrentIndex(0);
      setCurrentUrl(sign.imageUrl);
      setIsLoading(false);
      return;
    }

    // 1. Check localStorage / memory cache
    const cachedUrl = getCachedSignUrl(sign.code);
    const generatedList = generateCandidateUrls(
      sign.code,
      sign.nom,
      sign.signification,
      sign.imageUrl
    );

    let fullList: string[];
    if (cachedUrl) {
      // Put cached working URL first, followed by others without duplicates
      fullList = [cachedUrl, ...generatedList.filter((u) => u !== cachedUrl)];
    } else {
      fullList = generatedList;
    }

    setCandidates(fullList);
    setCurrentIndex(0);
    setCurrentUrl(fullList[0] || sign.imageUrl || '');
  }, [sign.code, sign.nom, sign.signification, sign.imageUrl]);

  const handleImageError = async () => {
    // If next candidate variant is available, try it
    if (currentIndex + 1 < candidates.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentUrl(candidates[nextIdx]);
      setIsLoading(true);
      return;
    }

    // All static variants exhausted: try Wikimedia Commons Search API if not already tried
    if (!hasTriedSearch && !isSearchingApi) {
      setHasTriedSearch(true);
      setIsSearchingApi(true);

      const foundUrl = await searchWikimediaForSign(sign.code);
      if (!isMountedRef.current) return;

      setIsSearchingApi(false);

      if (foundUrl && !candidates.includes(foundUrl)) {
        // Try loading the API-resolved SVG
        setCandidates((prev) => [...prev, foundUrl]);
        setCurrentIndex(candidates.length);
        setCurrentUrl(foundUrl);
        setIsLoading(true);
        return;
      }
    }

    // Both variants and search API failed: render fallback frame without crashing
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setIsSearchingApi(false);
    if (currentUrl) {
      // Cache the working URL to localStorage
      saveWorkingSignUrl(sign.code, currentUrl);
    }
  };

  if (hasError) {
    return (
      <div
        className={
          fallbackClassName ||
          'w-full h-full min-h-[90px] rounded-xl bg-slate-200 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 p-2 flex flex-col items-center justify-center text-center select-none shadow-inner'
        }
        title={`Panneau ${sign.code} : ${sign.nom} (Image indisponible)`}
      >
        <ImageOff className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-1 shrink-0" />
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">
          {sign.code}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight font-medium">
          {sign.nom}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-100/90 dark:bg-slate-800/70 backdrop-blur-xs animate-pulse z-10">
          {isSearchingApi ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin mb-1" />
          ) : (
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-tight">
              {sign.code}
            </span>
          )}
        </div>
      )}
      {currentUrl && (
        <img
          key={currentUrl}
          src={currentUrl}
          alt={`${sign.nom} (${sign.code})`}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${imageClassName} transition-opacity duration-200 select-none ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
};
