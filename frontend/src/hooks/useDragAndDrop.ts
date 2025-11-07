import { useState, useRef, useCallback } from 'react';

interface DragItem {
  id: string;
  index: number;
}

interface UseDragAndDropProps<T> {
  items: T[];
  onReorder: (reorderedItems: T[]) => void;
  itemIdField: keyof T;
}

export const useDragAndDrop = <T extends Record<string, any>>({
  items,
  onReorder,
  itemIdField
}: UseDragAndDropProps<T>) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const item = items[index];
    if (!item) return;

    setDraggedItem({ id: item[itemIdField], index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, [items, itemIdField]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    // Create new array with reordered items
    const newItems = [...items];
    const draggedItemData = newItems[draggedItem.index];
    
    // Remove dragged item from original position
    newItems.splice(draggedItem.index, 1);
    
    // Insert at new position
    const adjustedDropIndex = draggedItem.index < dropIndex ? dropIndex - 1 : dropIndex;
    newItems.splice(adjustedDropIndex, 0, draggedItemData);
    
    // Update order property if it exists
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index
    }));

    onReorder(reorderedItems);
    setDragOverIndex(null);
  }, [draggedItem, items, onReorder]);

  return {
    draggedItem,
    dragOverIndex,
    dragRef,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
