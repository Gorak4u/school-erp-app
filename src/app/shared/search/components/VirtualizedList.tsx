// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * High-Performance Virtualized List
 * Handles 10M+ records with smooth scrolling
 */

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  overscan?: number;
  theme?: 'dark' | 'light';
  className?: string;
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  theme = 'light',
  className = ''
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerSize.height) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerSize.height, overscan, items.length]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Render visible items
  const visibleItems = useMemo(() => {
    const result = [];
    
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      const item = items[i];
      if (item) {
        result.push({
          index: i,
          item,
          top: i * itemHeight,
          isVisible: i >= visibleRange.startIndex && i <= visibleRange.endIndex
        });
      }
    }
    
    return result;
  }, [visibleRange, items, itemHeight]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ height: containerHeight }}
    >
      {/* Scroll container */}
      <div
        ref={scrollElementRef}
        className="absolute inset-0 overflow-auto"
        onScroll={handleScroll}
      >
        {/* Spacer for total height */}
        <div
          style={{
            height: items.length * itemHeight,
            position: 'relative'
          }}
        >
          {/* Visible items */}
          {visibleItems.map(({ index, item, top, isVisible }) => (
            <div
              key={index}
              className="absolute left-0 right-0"
              style={{
                top,
                height: itemHeight,
                transform: 'translateZ(0)', // Hardware acceleration
                willChange: 'transform' // Optimize for animations
              }}
            >
              {renderItem(item, index, isVisible)}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicators */}
      {items.length > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            theme === 'dark' 
              ? 'bg-gray-800 text-gray-300' 
              : 'bg-white text-gray-700 shadow'
          }`}>
            {visibleRange.startIndex + 1}-{Math.min(visibleRange.endIndex + 1, items.length)} of {items.length}
          </div>
          
          {/* Scroll progress bar */}
          <div className={`w-20 h-1 rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div
              className={`h-full transition-all duration-150 ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
              }`}
              style={{
                width: `${((visibleRange.endIndex + 1) / items.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced Virtualized List with Search Integration
 */
interface EnhancedVirtualizedListProps<T> extends VirtualizedListProps<T> {
  searchQuery?: string;
  highlightedIndex?: number;
  onItemSelect?: (item: T, index: number) => void;
  onItemHover?: (item: T, index: number) => void;
}

export function EnhancedVirtualizedList<T>({
  items,
  searchQuery,
  highlightedIndex,
  onItemSelect,
  onItemHover,
  ...props
}: EnhancedVirtualizedListProps<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Highlight matching text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 text-black font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Enhanced render item
  const enhancedRenderItem = (item: T, index: number, isVisible: boolean) => {
    const isHighlighted = highlightedIndex === index;
    const isHovered = hoveredIndex === index;

    return (
      <div
        className={`
          border-b transition-all duration-150 cursor-pointer
          ${props.theme === 'dark' 
            ? 'border-gray-700 hover:bg-gray-800' 
            : 'border-gray-200 hover:bg-gray-50'
          }
          ${isHighlighted 
            ? props.theme === 'dark' 
              ? 'bg-blue-900/30 border-blue-600' 
              : 'bg-blue-50 border-blue-300' 
            : ''
          }
          ${isHovered && !isHighlighted 
            ? props.theme === 'dark' 
              ? 'bg-gray-700' 
              : 'bg-gray-100' 
            : ''
          }
        `}
        style={{ height: props.itemHeight }}
        onClick={() => onItemSelect?.(item, index)}
        onMouseEnter={() => {
          setHoveredIndex(index);
          onItemHover?.(item, index);
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {props.renderItem(item, index, isVisible)}
      </div>
    );
  };

  return (
    <VirtualizedList
      {...props}
      items={items}
      renderItem={enhancedRenderItem}
    />
  );
}

/**
 * Performance-optimized Virtualized Grid
 */
interface VirtualizedGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  gap?: number;
  theme?: 'dark' | 'light';
}

export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 16,
  theme = 'light'
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 1);
    const endRow = Math.min(
      rowsCount - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + 1
    );

    const startIndex = startRow * columnsCount;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columnsCount - 1);

    return { startIndex, endIndex, startRow, endRow };
  }, [scrollTop, itemHeight, gap, containerHeight, rowsCount, columnsCount, items.length]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Render visible items
  const visibleItems = useMemo(() => {
    const result = [];
    
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex && i < items.length; i++) {
      const item = items[i];
      if (item) {
        const row = Math.floor(i / columnsCount);
        const col = i % columnsCount;
        const top = row * (itemHeight + gap);
        const left = col * (itemWidth + gap);
        
        result.push({
          index: i,
          item,
          top,
          left,
          isVisible: i >= visibleRange.startIndex && i <= visibleRange.endIndex
        });
      }
    }
    
    return result;
  }, [visibleRange, items, itemWidth, itemHeight, gap, columnsCount]);

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: containerHeight, width: containerWidth }}
    >
      <div
        ref={scrollElementRef}
        className="absolute inset-0 overflow-auto"
        onScroll={handleScroll}
      >
        <div
          style={{
            height: rowsCount * (itemHeight + gap),
            width: columnsCount * (itemWidth + gap),
            position: 'relative'
          }}
        >
          {visibleItems.map(({ index, item, top, left, isVisible }) => (
            <div
              key={index}
              className="absolute"
              style={{
                top,
                left,
                width: itemWidth,
                height: itemHeight,
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            >
              {renderItem(item, index, isVisible)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
