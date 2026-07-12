import Link from "next/link";

export function TableText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] font-semibold tracking-[-0.28px] text-black">{children}</p>
  );
}

export type DataTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Return a href to make the row a link (e.g. to a detail page); return undefined to render a plain row. */
  rowHref?: (row: T) => string | undefined;
  minWidthClassName?: string;
  rowHeightClassName?: string;
  rowGapClassName?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  minWidthClassName = "min-w-[640px]",
  rowHeightClassName = "",
  rowGapClassName = "gap-[11px]",
}: DataTableProps<T>) {
  const gridTemplateColumns = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` };

  return (
    <div className="w-full overflow-x-auto">
      <div className={`flex w-full ${minWidthClassName} flex-col gap-[12px]`}>
        <div
          className="grid w-full border-b-2 border-black pb-[14px]"
          style={gridTemplateColumns}
        >
          {columns.map((column) => (
            <p
              key={column.key}
              className="text-center text-[14px] font-semibold tracking-[-0.28px] text-muted"
            >
              {column.label}
            </p>
          ))}
        </div>

        <div className={`flex w-full flex-col ${rowGapClassName}`}>
          {rows.map((row) => {
            const href = rowHref?.(row);
            const rowClassName = `grid w-full items-center border-b border-divider pb-[12px] ${rowHeightClassName} ${
              href ? "transition-colors hover:bg-white" : ""
            }`;
            const cells = columns.map((column) => (
              <div key={column.key} className="flex items-center justify-center">
                {column.render(row)}
              </div>
            ));

            return href ? (
              <Link
                key={rowKey(row)}
                href={href}
                className={rowClassName}
                style={gridTemplateColumns}
              >
                {cells}
              </Link>
            ) : (
              <div key={rowKey(row)} className={rowClassName} style={gridTemplateColumns}>
                {cells}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
