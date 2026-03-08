import { formatWidth } from "@/lib/utils";
import { FABRIC_TYPE_LABELS } from "@/types/product";
import type { FabricMetadata } from "@/types/product";

interface ProductSpecsProps {
  meta: FabricMetadata | null;
}

/**
 * Таблица характеристик товара (тип, состав, ширина, цвет и т. д.).
 */
export function ProductSpecs({ meta }: ProductSpecsProps) {
  if (!meta) return null;

  const specs = [
    { label: "Тип ткани", value: meta.fabric_type && (FABRIC_TYPE_LABELS[meta.fabric_type] || meta.fabric_type) },
    { label: "Состав", value: meta.composition },
    { label: "Ширина", value: meta.width_cm && formatWidth(meta.width_cm) },
    { label: "Страна", value: meta.country },
    {
      label: "Цвет",
      value: meta.color,
      render: () => (
        <dd className="flex items-center gap-2 text-gray-900">
          {meta.color_hex && (
            <span
              className="inline-block h-4 w-4 rounded-full border"
              style={{ backgroundColor: meta.color_hex }}
            />
          )}
          {meta.color}
        </dd>
      ),
    },
    { label: "Коллекция", value: meta.collection_name },
    { label: "Качество", value: meta.quality },
  ];

  const visibleSpecs = specs.filter((s) => s.value);
  if (visibleSpecs.length === 0) return null;

  return (
    <div className="space-y-3 border-t border-gray-200 pt-6">
      <h2 className="text-sm font-semibold text-gray-900">Характеристики</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {visibleSpecs.map((spec) => (
          <SpecRow key={spec.label} label={spec.label} render={spec.render}>
            {spec.value}
          </SpecRow>
        ))}
      </dl>
    </div>
  );
}

function SpecRow({
  label,
  children,
  render,
}: {
  label: string;
  children?: React.ReactNode;
  render?: () => React.ReactNode;
}) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      {render ? render() : <dd className="text-gray-900">{children}</dd>}
    </>
  );
}
