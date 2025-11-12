import { useRef } from 'react';
import Moveable from 'react-moveable';
import { flushSync } from 'react-dom';
import type { TextElement } from '@/types/asset';

interface DraggableTextBoxProps {
  textElement: TextElement;
  onUpdate: (id: string, updates: Partial<TextElement>) => void;
  isDragging: boolean;
  isResizing: boolean;
  isSelected?: boolean;
  hasOverlap?: boolean;
  onDragStart: () => void;
  onDragEnd: (left: number, top: number) => void;
  onResizeStart: () => void;
  onResizeEnd: (width: number, height: number, left: number, top: number) => void;
  bounds: { left: number; top: number; right: number; bottom: number };
  verticalGuidelines: number[];
  horizontalGuidelines: number[];
}

export function DraggableTextBox({
  textElement,
  onUpdate,
  isDragging,
  isResizing,
  isSelected = false,
  hasOverlap = false,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  bounds,
  verticalGuidelines,
  horizontalGuidelines
}: DraggableTextBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable>(null);

  return (
    <>
      <div
        ref={ref}
        className={`draggable-text ${
          isDragging ? 'dragging' : ''
        } ${
          isResizing ? 'resizing' : ''
        } ${
          isSelected ? 'selected' : ''
        }`}
        style={{
          position: 'absolute',
          left: `${textElement.position.x}px`,
          top: `${textElement.position.y}px`,
          width: `${textElement.position.width}px`,
          height: textElement.position.height === 'auto'
            ? 'auto'
            : `${textElement.position.height}px`,
          fontSize: `${textElement.styling.fontSize}px`,
          fontWeight: textElement.styling.fontWeight,
          fontStyle: textElement.styling.italic ? 'italic' : 'normal',
          textDecoration: textElement.styling.underline ? 'underline' : 'none',
          color: textElement.styling.color,
          fontFamily: 'Arial, sans-serif',
          textAlign: textElement.styling.textAlign,
          letterSpacing: `${textElement.styling.letterSpacing}px`,
          lineHeight: `${textElement.styling.fontSize + textElement.styling.lineSpacing}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: textElement.styling.textAlign === 'left'
            ? 'flex-start'
            : textElement.styling.textAlign === 'right'
            ? 'flex-end'
            : 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          padding: '8px',
          wordWrap: 'break-word',
          whiteSpace: 'pre-line',
          overflow: 'hidden',
          textShadow: textElement.styling.color === '#FFFFFF'
            ? '2px 2px 4px rgba(0,0,0,0.8)'
            : 'none',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
          zIndex: textElement.displayOrder,
        }}
      >
        {hasOverlap && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
            ⚠️ Overlaps
          </div>
        )}
        {textElement.content}
      </div>

      <Moveable
        ref={moveableRef}
        target={ref}
        draggable={true}
        resizable={true}
        snappable={true}
        snapThreshold={21}
        verticalGuidelines={verticalGuidelines}
        horizontalGuidelines={horizontalGuidelines}
        isDisplaySnapDigit={true}
        bounds={bounds}
        renderDirections={['w', 'e', 'n', 's']}
        flushSync={flushSync}
        onDragStart={onDragStart}
        onDrag={(e) => {
          if (e.target instanceof HTMLElement) {
            e.target.style.left = `${e.left}px`;
            e.target.style.top = `${e.top}px`;
          }
        }}
        onDragEnd={(e) => {
          onDragEnd(e.lastEvent!.left, e.lastEvent!.top);
        }}
        onResizeStart={onResizeStart}
        onResize={(e) => {
          if (e.target instanceof HTMLElement) {
            e.target.style.width = `${e.width}px`;
            e.target.style.height = `${e.height}px`;
            e.target.style.left = `${e.drag.left}px`;
            e.target.style.top = `${e.drag.top}px`;
          }
        }}
        onResizeEnd={(e) => {
          onResizeEnd(
            e.lastEvent!.width,
            e.lastEvent!.height,
            e.lastEvent!.drag.left,
            e.lastEvent!.drag.top
          );
        }}
      />
    </>
  );
}
