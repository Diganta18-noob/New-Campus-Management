import React from "react";
import {
  Box,
  Pagination as MuiPagination,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";

export const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mt: 3,
      p: 2,
      borderTop: "1px solid #e5e7eb",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Typography variant="body2">Items per page:</Typography>
      <Select
        value={pageSize}
        onChange={(e) => onPageSizeChange(e.target.value)}
        size="small"
        sx={{ width: 80 }}
      >
        {pageSizeOptions.map((size) => (
          <MenuItem key={size} value={size}>
            {size}
          </MenuItem>
        ))}
      </Select>
    </Box>

    <MuiPagination
      count={totalPages}
      page={currentPage}
      onChange={(e, page) => onPageChange(page)}
      color="primary"
      variant="outlined"
      shape="rounded"
    />

    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      Page {currentPage} of {totalPages}
    </Typography>
  </Box>
);

export default Pagination;
