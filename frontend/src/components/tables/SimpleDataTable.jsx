import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
  Box,
  TablePagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { EmptyState, LoadingSpinner } from "../common";

export const SimpleDataTable = ({
  columns,
  data = [],
  isLoading = false,
  onEdit,
  onDelete,
  isSelectable = false,
  selectedRows = [],
  onSelectRow,
  pagination = { page: 0, rowsPerPage: 10 },
  onPaginationChange,
  totalCount,
}) => {
  const [page, setPage] = React.useState(pagination.page || 0);
  const [rowsPerPage, setRowsPerPage] = React.useState(
    pagination.rowsPerPage || 10,
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    onPaginationChange?.({ page: newPage, rowsPerPage });
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onPaginationChange?.({ page: 0, rowsPerPage: newRowsPerPage });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading data..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No data available" />;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            {isSelectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedRows.length > 0 && selectedRows.length < data.length
                  }
                  checked={
                    selectedRows.length === data.length && data.length > 0
                  }
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
              <TableCell key={column.key} sx={{ fontWeight: 600 }}>
                {column.label}
              </TableCell>
            ))}

            {(onEdit || onDelete) && (
              <TableCell sx={{ textAlign: "center" }}>Actions</TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((row) => (
            <TableRow key={row._id} hover>
              {isSelectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRows.includes(row._id)}
                    onChange={() => onSelectRow?.(row._id)}
                  />
                </TableCell>
              )}

              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </TableCell>
              ))}

              {(onEdit || onDelete) && (
                <TableCell
                  sx={{ textAlign: "center", display: "flex", gap: 1 }}
                >
                  {onEdit && (
                    <IconButton
                      size="small"
                      onClick={() => onEdit(row)}
                      title="Edit"
                    >
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
          ))}
        </TableBody>
      </Table>

      {onPaginationChange && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={totalCount || data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </TableContainer>
  );
};

export default SimpleDataTable;
