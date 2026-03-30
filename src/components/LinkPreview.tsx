'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, FileText, Video, Music } from 'lucide-react';

interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  type?: 'website' | 'video' | 'audio' | 'document';
}

interface LinkPreviewProps {
  url: string;
  metadata?: LinkMetadata;
  onFetch?: (url: string) => Promise<LinkMetadata>;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, metadata: initialMetadata, onFetch }) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(initialMetadata || null);
  const [loading, setLoading] = useState(!initialMetadata);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!initialMetadata && onFetch) {
      setLoading(true);
      onFetch(url)
        .then(setMetadata)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [url, initialMetadata, onFetch]);

  if (error || (!loading && !metadata)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline text-sm inline-flex items-center gap-1"
      >
        {url}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  if (loading) {
    return (
      <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  const getIcon = () => {
    switch (metadata?.type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 block rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
    >
      {metadata?.image && (
        <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <img
            src={metadata.image}
            alt={metadata.title || 'Preview'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-1 text-gray-500 dark:text-gray-400">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {metadata?.title && (
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                {metadata.title}
              </h4>
            )}
            {metadata?.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {metadata.description}
              </p>
            )}
            {metadata?.domain && (
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                {metadata.domain}
                <ExternalLink className="w-3 h-3" />
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
};
