"use client";

import { memo } from "react";
import { Minus, Plus } from "lucide-react";
import { cmToMeters } from "@/lib/utils";

interface FabricQuantityControlProps {
  quantityCm: number;
  stepCm: number;
  minCm: number;
  loading: boolean;
  onUpdate: (newQtyCm: number) => void;
  onRemove: () => void;
}

/**
 * Управление количеством для тканей (шаг 0.1 м = 10 см).
 */
export const FabricQuantityControl = memo(({
  quantityCm,
  stepCm,
  minCm,
  loading,
  onUpdate,
  onRemove,
}: FabricQuantityControlProps) => {
  const displayMeters = cmToMeters(quantityCm);

  const decrease = () => {
    const next = quantityCm - stepCm;
    if (next < minCm) {
      onRemove();
    } else {
      onUpdate(next);
    }
  };

  const increase = () => {
    onUpdate(quantityCm + stepCm);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-gray-300">
        <button
          type="button"
          onClick={decrease}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-14 text-center text-sm font-medium">
          {displayMeters}
        </span>
        <button
          type="button"
          onClick={increase}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <span className="text-xs text-gray-500">пог. м</span>
    </div>
  );
});

FabricQuantityControl.displayName = "FabricQuantityControl";

interface PieceQuantityControlProps {
  quantity: number;
  loading: boolean;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
}

/**
 * Управление количеством для штучных товаров.
 */
export const PieceQuantityControl = memo(({
  quantity,
  loading,
  onUpdate,
  onRemove,
}: PieceQuantityControlProps) => {
  return (
    <div className="flex items-center rounded-lg border border-gray-300">
      <button
        type="button"
        onClick={() => {
          if (quantity <= 1) onRemove();
          else onUpdate(quantity - 1);
        }}
        disabled={loading}
        className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-10 text-center text-sm font-medium">{quantity}</span>
      <button
        type="button"
        onClick={() => onUpdate(quantity + 1)}
        disabled={loading}
        className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

PieceQuantityControl.displayName = "PieceQuantityControl";
