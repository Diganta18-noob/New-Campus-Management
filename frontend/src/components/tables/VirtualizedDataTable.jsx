import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
  Checkbox,
} from "@mui/material";
import { List } from "react-window";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { EmptyState, LoadingSpinner } from "../common";

const VirtualizedTableRow = React.memo(({ data, index, style }) => {
  const row = data[index];
  const { columns, onEdit, onDelete, isSelectable, selectedRows, onSelectRow } =
    data.config;

  return (
    <TableRow
      hover
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        height: style.height || "auto",
      }}
    >
      {isSelectable && (
        <TableCell
          padding="checkbox"
          sx={{
            width: 50,
            minWidth: 50,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Checkbox
            checked={selectedRows?.includes(row._id)}
            onChange={() => onSelectRow?.(row._id)}
          />
        </TableCell>
      )}

      {columns.map((column) => (
        <TableCell
          key={column.key}
          sx={{
            flex: column.flex || 1,
            minWidth: column.minWidth || 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {column.render
            ? column.render(row[column.key], row)
            : row[column.key]}
        </TableCell>
      ))}

      {(onEdit || onDelete) && (
        <TableCell
          sx={{
            width: 100,
            minWidth: 100,
            display: "flex",
            gap: 1,
            justifyContent: "flex-end",
          }}
        >
          {onEdit && (
            <IconButton size="small" onClick={() => onEdit(row)} title="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(row._id)}
              title="Delete"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </TableCell>
      )}
    </TableRow>
  );
});

VirtualizedTableRow.displayName = "VirtualizedTableRow";

export const VirtualizedDataTable = ({
  columns,
  data = [],
  isLoading = false,
  onEdit,
  onDelete,
  isSelectable = false,
  selectedRows = [],
  onSelectRow,
  rowHeight = 53,
  maxHeight = 600,
  emptyMessage = "No data available",
}) => {
  const itemData = useMemo(
    () => ({
      items: data,
      config: {
        columns,
        onEdit,
        onDelete,
        isSelectable,
        selectedRows,
        onSelectRow,
      },
    }),
    [data, columns, onEdit, onDelete, isSelectable, selectedRows, onSelectRow],
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading data..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <Box sx={{ overflow: "auto" }}>
      <TableContainer component={Paper} sx={{ maxHeight }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ display: "flex", alignItems: "center" }}>
              {isSelectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    width: 50,
                    minWidth: 50,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Checkbox
                    indeterminate={
                      selectedRows.length > 0 &&
                      selectedRows.length < data.length
                    }
                    checked={selectedRows.length === data.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectRow?.(data.map((row) => row._id));
                      } else {
                        onSelectRow?.([]);
                      }
                    }}
                  />
                </TableCell>
              )}

              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  sx={{
                    flex: column.flex || 1,
                    minWidth: column.minWidth || 100,
                    fontWeight: 600,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}

              {(onEdit || onDelete) && (
                <TableCell
                  sx={{ width: 100, minWidth: 100, textAlign: "center" }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
        </Table>

        <List
          height={maxHeight - 56}
          itemCount={data.length}
          itemSize={rowHeight}
          width="100%"
          itemData={{
            ...itemData.items,
            config: itemData.config,
          }}
        >
          {({ index, style }) => (
            <VirtualizedTableRow
              data={data}
              index={index}
              style={style}
              config={itemData.config}
            />
          )}
        </List>
      </TableContainer>
    </Box>
  );
};

export default VirtualizedDataTable;
