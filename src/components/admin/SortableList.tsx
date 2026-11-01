"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemRenderProps {
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
  isDragging: boolean;
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  layout?: "vertical" | "grid";
  gridClassName?: string;
  renderItem: (item: T, index: number, props: SortableItemRenderProps) => React.ReactNode;
}

function SortableRow<T extends { id: string }>({
  item,
  index,
  renderItem,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number, props: SortableItemRenderProps) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, index, {
        dragHandleProps: {
          ...attributes,
          ...listeners,
        },
        isDragging,
      })}
    </div>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  layout = "vertical",
  gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={
          layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy
        }
      >
        <div
          className={
            layout === "grid" ? gridClassName : "flex flex-col space-y-4"
          }
        >
          {items.map((item, idx) => (
            <SortableRow
              key={item.id}
              item={item}
              index={idx}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandleButton({
  dragHandleProps,
  label = "Arrastar para reordenar",
}: {
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...dragHandleProps}
      className="p-2 text-[#8C8780] hover:text-[#181716] cursor-grab active:cursor-grabbing touch-none transition-colors"
    >
      <GripVertical size={17} />
    </button>
  );
}

