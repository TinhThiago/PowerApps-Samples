import * as React from "react";
import { IInputs } from "./generated/ManifestTypes";

type Dataset = ComponentFramework.PropertyTypes.DataSet;
type DataSetColumn = ComponentFramework.PropertyHelper.DataSetApi.Column;
type EntityRecord = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord;
type SortDirection = 0 | 1;
type FilterOperator =
  | "equals"
  | "notEqual"
  | "contains"
  | "notContains"
  | "beginsWith"
  | "notBeginsWith"
  | "endsWith"
  | "notEndsWith"
  | "containsData"
  | "notContainsData"
  | "greaterThan"
  | "greaterEqual"
  | "lessThan"
  | "lessEqual"
  | "on"
  | "onOrAfter"
  | "onOrBefore"
  | "today"
  | "yesterday"
  | "tomorrow"
  | "thisWeek"
  | "thisMonth"
  | "thisYear";

interface FilterOption {
  value: FilterOperator;
  label: string;
  conditionOperator: number;
  requiresValue: boolean;
  inputType: "text" | "number" | "date";
}

interface SubtotalGridProps {
  context: ComponentFramework.Context<IInputs>;
  dataset: Dataset;
}

const NUMBER_TYPES = [
  "whole",
  "decimal",
  "double",
  "float",
  "fp",
  "currency",
  "money",
  "number"
];

function isNumberColumn(column: DataSetColumn): boolean {
  const dataType =
    typeof column.dataType === "string"
      ? column.dataType.toLowerCase()
      : "";

  return NUMBER_TYPES.some((type) => dataType.includes(type));
}
function isDateColumn(column: DataSetColumn): boolean {
  const dataType =
    typeof column.dataType === "string"
      ? column.dataType.toLowerCase()
      : "";

  return dataType.includes("date") || dataType.includes("time");
}

function getFilterOptions(column: DataSetColumn): FilterOption[] {
  if (isNumberColumn(column)) {
    return [
      { value: "equals", label: "Equals", conditionOperator: 0, requiresValue: true, inputType: "number" },
      { value: "notEqual", label: "Does not equal", conditionOperator: 1, requiresValue: true, inputType: "number" },
      { value: "containsData", label: "Contains data", conditionOperator: 13, requiresValue: false, inputType: "number" },
      { value: "notContainsData", label: "Does not contain data", conditionOperator: 12, requiresValue: false, inputType: "number" },
      { value: "greaterThan", label: "Greater than", conditionOperator: 2, requiresValue: true, inputType: "number" },
      { value: "greaterEqual", label: "Greater than or equal to", conditionOperator: 4, requiresValue: true, inputType: "number" },
      { value: "lessThan", label: "Less than", conditionOperator: 3, requiresValue: true, inputType: "number" },
      { value: "lessEqual", label: "Less than or equal to", conditionOperator: 5, requiresValue: true, inputType: "number" }
    ];
  }

  if (isDateColumn(column)) {
    return [
      { value: "on", label: "On", conditionOperator: 25, requiresValue: true, inputType: "date" },
      { value: "onOrAfter", label: "On or after", conditionOperator: 27, requiresValue: true, inputType: "date" },
      { value: "onOrBefore", label: "On or before", conditionOperator: 26, requiresValue: true, inputType: "date" },
      { value: "today", label: "Today", conditionOperator: 15, requiresValue: false, inputType: "date" },
      { value: "yesterday", label: "Yesterday", conditionOperator: 14, requiresValue: false, inputType: "date" },
      { value: "tomorrow", label: "Tomorrow", conditionOperator: 16, requiresValue: false, inputType: "date" },
      { value: "thisWeek", label: "This week", conditionOperator: 20, requiresValue: false, inputType: "date" },
      { value: "thisMonth", label: "This month", conditionOperator: 23, requiresValue: false, inputType: "date" },
      { value: "thisYear", label: "This year", conditionOperator: 29, requiresValue: false, inputType: "date" },
      { value: "containsData", label: "Contains data", conditionOperator: 13, requiresValue: false, inputType: "date" },
      { value: "notContainsData", label: "Does not contain data", conditionOperator: 12, requiresValue: false, inputType: "date" }
    ];
  }

  return [
    { value: "equals", label: "Equals", conditionOperator: 0, requiresValue: true, inputType: "text" },
    { value: "notEqual", label: "Does not equal", conditionOperator: 1, requiresValue: true, inputType: "text" },
    { value: "contains", label: "Contains", conditionOperator: 49, requiresValue: true, inputType: "text" },
    { value: "notContains", label: "Does not contain", conditionOperator: 50, requiresValue: true, inputType: "text" },
    { value: "beginsWith", label: "Begins with", conditionOperator: 54, requiresValue: true, inputType: "text" },
    { value: "notBeginsWith", label: "Does not begin with", conditionOperator: 55, requiresValue: true, inputType: "text" },
    { value: "endsWith", label: "Ends with", conditionOperator: 56, requiresValue: true, inputType: "text" },
    { value: "notEndsWith", label: "Does not end with", conditionOperator: 57, requiresValue: true, inputType: "text" },
    { value: "containsData", label: "Contains data", conditionOperator: 13, requiresValue: false, inputType: "text" },
    { value: "notContainsData", label: "Does not contain data", conditionOperator: 12, requiresValue: false, inputType: "text" }
  ];
}

function getDefaultFilterOperator(column: DataSetColumn): FilterOperator {
  if (isDateColumn(column)) return "on";
  if (isNumberColumn(column)) return "equals";
  return "contains";
}
function safeToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  switch (typeof value) {
    case "string":
      return value;

    case "number":
    case "boolean":
    case "bigint":
      return value.toString();

    case "object":
      if (value instanceof Date) {
        return value.toLocaleString();
      }

      return "";

    default:
      return "";
  }
}
function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const textValue = safeToString(value);
  const parsed = Number(textValue.replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function getCellValue(record: EntityRecord, columnName: string): unknown {
  try {
    return record.getValue(columnName);
  } catch {
    return null;
  }
}

function getCellText(record: EntityRecord, columnName: string): string {
  try {
    const formatted = record.getFormattedValue(columnName);

    if (formatted !== null && formatted !== undefined && formatted !== "") {
      return safeToString(formatted);
    }

    const raw = record.getValue(columnName);
    return safeToString(raw);
  } catch {
    return "";
  }
}

function formatSubtotal(
  context: ComponentFramework.Context<IInputs>,
  value: number
): string {
  try {
    return context.formatting.formatDecimal(value);
  } catch {
    return value.toLocaleString();
  }
}

export const SubtotalGrid: React.FC<SubtotalGridProps> = ({
  context,
  dataset
}) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [openMenuColumn, setOpenMenuColumn] = React.useState<string | null>(null);
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({});
  const [columnOperators, setColumnOperators] = React.useState<Record<string, FilterOperator>>({});

  const columns = React.useMemo(() => {
    return dataset.columns.filter((column) => !column.isHidden);
  }, [dataset.columns]);

  const numberColumns = React.useMemo(() => {
    return columns.filter(isNumberColumn);
  }, [columns]);

  const recordIds = dataset.sortedRecordIds ?? [];

  React.useEffect(() => {
    const visibleIdSet = new Set(recordIds);
    setSelectedIds((current) => current.filter((id) => visibleIdSet.has(id)));
  }, [recordIds.join("|")]);

  const selectedIdSet = React.useMemo(() => {
    return new Set(selectedIds);
  }, [selectedIds]);

  const allVisibleSelected =
    recordIds.length > 0 && recordIds.every((id) => selectedIdSet.has(id));

  const toggleRow = (recordId: string): void => {
    setSelectedIds((current) => {
      const next = current.includes(recordId)
        ? current.filter((id) => id !== recordId)
        : [...current, recordId];

      dataset.setSelectedRecordIds(next);
      return next;
    });
  };

  const toggleAllVisible = (): void => {
    const next = allVisibleSelected ? [] : [...recordIds];
    setSelectedIds(next);
    dataset.setSelectedRecordIds(next);
  };

  const subtotalByColumn = React.useMemo(() => {
    const result: Record<string, number> = {};

    for (const column of numberColumns) {
      result[column.name] = 0;
    }

    for (const recordId of selectedIds) {
      const record = dataset.records[recordId];
      if (!record) continue;

      for (const column of numberColumns) {
        result[column.name] += toNumber(getCellValue(record, column.name));
      }
    }

    return result;
  }, [selectedIds, dataset.records, numberColumns]);

  const openRecord = (record: EntityRecord): void => {
    try {
      dataset.openDatasetItem(record.getNamedReference());
    } catch {
      // Fallback: bỏ qua nếu host không hỗ trợ openDatasetItem.
    }
  };
  const closeHeaderMenu = (): void => {
    setOpenMenuColumn(null);
  };

  const getCurrentSortDirection = (columnName: string): SortDirection | null => {
    const currentSort = dataset.sorting?.find(
      (sortItem) => sortItem.name === columnName
    );

    if (!currentSort) {
      return null;
    }

    return currentSort.sortDirection as SortDirection;
  };

  const toggleSortColumn = (columnName: string): void => {
    const currentDirection = getCurrentSortDirection(columnName);
    const nextDirection: SortDirection = currentDirection === 0 ? 1 : 0;

    dataset.sorting = [
      {
        name: columnName,
        sortDirection: nextDirection
      }
    ];

    dataset.refresh();
  };

  const sortColumnAsc = (columnName: string): void => {
    dataset.sorting = [
      {
        name: columnName,
        sortDirection: 0
      }
    ];

    closeHeaderMenu();
    dataset.refresh();
  };

  const sortColumnDesc = (columnName: string): void => {
    dataset.sorting = [
      {
        name: columnName,
        sortDirection: 1
      }
    ];

    closeHeaderMenu();
    dataset.refresh();
  };

  const applyAllColumnFilters = (
    nextFilters: Record<string, string>,
    nextOperators: Record<string, FilterOperator>
  ): void => {
    const conditions = Object.entries(nextOperators)
      .map(([attributeName, operator]) => {
        const column = columns.find((item) => item.name === attributeName);

        if (!column) {
          return null;
        }

        const option = getFilterOptions(column).find(
          (item) => item.value === operator
        );

        if (!option) {
          return null;
        }

        const rawValue = nextFilters[attributeName] ?? "";
        const value = rawValue.trim();

        if (option.requiresValue && value === "") {
          return null;
        }

        return {
          attributeName,
          conditionOperator: option.conditionOperator,
          value: option.requiresValue ? value : ""
        };
      })
      .filter(
        (
          condition
        ): condition is {
          attributeName: string;
          conditionOperator: number;
          value: string;
        } => condition !== null
      );

    if (conditions.length === 0) {
      dataset.filtering.clearFilter();
      dataset.refresh();
      return;
    }

    dataset.filtering.setFilter({
      conditions,
      filterOperator: 0
    } as ComponentFramework.PropertyHelper.DataSetApi.FilterExpression);

    dataset.refresh();
  };


  const setColumnFilterValue = (columnName: string, value: string): void => {
    setColumnFilters((current) => ({
      ...current,
      [columnName]: value
    }));
  };

  const setColumnFilterOperator = (
    columnName: string,
    operator: FilterOperator
  ): void => {
    setColumnOperators((current) => ({
      ...current,
      [columnName]: operator
    }));
  };

  const applyColumnFilter = (): void => {
    applyAllColumnFilters(columnFilters, columnOperators);
    closeHeaderMenu();
  };

  const clearColumnFilter = (columnName: string): void => {
    const nextFilters = { ...columnFilters };
    delete nextFilters[columnName];

    const nextOperators = { ...columnOperators };
    delete nextOperators[columnName];

    setColumnFilters(nextFilters);
    setColumnOperators(nextOperators);

    applyAllColumnFilters(nextFilters, nextOperators);
    closeHeaderMenu();
  };
  if (dataset.loading) {
    return <div className="subtotal-grid-message">Đang tải dữ liệu...</div>;
  }

  if (dataset.error) {
    return (
      <div className="subtotal-grid-message subtotal-grid-error">
        Không tải được dữ liệu: {safeToString(dataset.errorMessage)}
      </div>
    );
  }

  return (
    <div className="subtotal-grid-root">
      <div className="subtotal-grid-scroll">
        <table className="subtotal-grid-table">
          <thead>
            <tr>
              <th className="subtotal-grid-checkbox-col">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Chọn tất cả dòng đang hiển thị"
                />
              </th>

              {columns.map((column) => {
                const sortDirection = getCurrentSortDirection(column.name);
                const isMenuOpen = openMenuColumn === column.name;
                const filterValue = columnFilters[column.name] ?? "";
                const filterOptions = getFilterOptions(column);
                const filterOperator =
                  columnOperators[column.name] ?? getDefaultFilterOperator(column);

                const selectedFilterOption =
                  filterOptions.find((item) => item.value === filterOperator) ??
                  filterOptions[0];

                const showFilterInput = selectedFilterOption.requiresValue;
                const hasFilter =
                  selectedFilterOption.requiresValue
                    ? filterValue.trim() !== ""
                    : columnOperators[column.name] !== undefined;

                return (
                  <th
                    key={column.name}
                    title={column.displayName}
                    className="subtotal-grid-header-th"
                  >
                    <div className="subtotal-grid-header-wrapper">
                      <button
                        type="button"
                        className="subtotal-grid-header-title"
                        onClick={() => toggleSortColumn(column.name)}
                      >
                        <span className="subtotal-grid-header-text">
                          {column.displayName}
                        </span>

                        {sortDirection === 0 && (
                          <span className="subtotal-grid-sort-icon">↓</span>
                        )}

                        {sortDirection === 1 && (
                          <span className="subtotal-grid-sort-icon">↑</span>
                        )}

                        {hasFilter && (
                          <span className="subtotal-grid-filter-active">●</span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="subtotal-grid-header-menu-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuColumn(isMenuOpen ? null : column.name);
                        }}
                        aria-label={`Mở menu cho cột ${column.displayName}`}
                      >
                        ˅
                      </button>

                      {isMenuOpen && (
                        <div
                          className="subtotal-grid-header-menu"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="subtotal-grid-menu-item"
                            onClick={() => sortColumnAsc(column.name)}
                          >
                            ↓ A to Z
                          </button>

                          <button
                            type="button"
                            className="subtotal-grid-menu-item"
                            onClick={() => sortColumnDesc(column.name)}
                          >
                            ↑ Z to A
                          </button>

                          <div className="subtotal-grid-menu-separator" />

                          <div className="subtotal-grid-menu-title">
                            Filter by
                          </div>

                          <div className="subtotal-grid-filter-block">
                            <select
                              className="subtotal-grid-filter-select"
                              value={filterOperator}
                              onChange={(event) => {
                                const nextOperator = event.target.value as FilterOperator;

                                setColumnFilterOperator(column.name, nextOperator);

                                const option = filterOptions.find(
                                  (item) => item.value === nextOperator
                                );

                                if (option && !option.requiresValue) {
                                  setColumnFilterValue(column.name, "");
                                }
                              }}
                            >
                              {filterOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            {showFilterInput && (
                              <input
                                type={selectedFilterOption.inputType}
                                className="subtotal-grid-menu-filter-input"
                                value={filterValue}
                                placeholder="Enter filter text"
                                onChange={(event) =>
                                  setColumnFilterValue(column.name, event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    applyColumnFilter();
                                  }

                                  if (event.key === "Escape") {
                                    closeHeaderMenu();
                                  }
                                }}
                              />
                            )}
                          </div>

                          <div className="subtotal-grid-menu-actions">
                            <button
                              type="button"
                              onClick={() => applyColumnFilter()}
                            >
                              Apply
                            </button>

                            <button
                              type="button"
                              onClick={() => clearColumnFilter(column.name)}
                              disabled={!hasFilter}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {recordIds.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="subtotal-grid-empty">
                  Không có dữ liệu.
                </td>
              </tr>
            )}

            {recordIds.map((recordId) => {
              const record = dataset.records[recordId];
              if (!record) return null;

              return (
                <tr key={recordId}>
                  <td className="subtotal-grid-checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedIdSet.has(recordId)}
                      onChange={() => toggleRow(recordId)}
                      aria-label="Chọn dòng"
                    />
                  </td>

                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.name}
                      className={isNumberColumn(column) ? "number-cell" : ""}
                      onDoubleClick={() => openRecord(record)}
                    >
                      {columnIndex === 0 ? (
                        <button
                          type="button"
                          className="subtotal-grid-link"
                          onClick={() => openRecord(record)}
                        >
                          {getCellText(record, column.name)}
                        </button>
                      ) : (
                        getCellText(record, column.name)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <td className="subtotal-grid-subtotal-label" colSpan={2}>
                Subtotal
              </td>

              {columns.slice(1).map((column) => {
                const isNumber = isNumberColumn(column);
                const subtotal = subtotalByColumn[column.name] ?? 0;

                return (
                  <td
                    key={column.name}
                    className={isNumber ? "number-cell subtotal-cell" : "subtotal-cell"}
                  >
                    {isNumber ? formatSubtotal(context, subtotal) : ""}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="subtotal-grid-footer">
        <span>
          Đã chọn: {selectedIds.length} / {recordIds.length}
        </span>
        <button
          type="button"
          disabled={!dataset.paging.hasPreviousPage}
          onClick={() => dataset.paging.loadPreviousPage()}
        >
          Trang trước
        </button>

        <button
          type="button"
          disabled={!dataset.paging.hasNextPage}
          onClick={() => dataset.paging.loadNextPage()}
        >
          Trang sau
        </button>

        <button
          type="button"
          onClick={() => dataset.refresh()}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};