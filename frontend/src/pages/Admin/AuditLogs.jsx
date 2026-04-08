import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  History as AuditIcon,
} from "@mui/icons-material";
import { useAuditLogs } from "../../hooks";
import { LoadingSpinner, EmptyState } from "../../components/common";

const entityTypes = ["All", "User", "Batch", "Topic", "Attendance", "Classroom", "Department"];
const actionTypes = ["All", "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"];

const getActionColor = (action) => {
  switch (action?.toUpperCase()) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    case "DELETE":
      return "error";
    case "STATUS_CHANGE":
      return "warning";
    default:
      return "default";
  }
};

// Row component with expandable details
const AuditRow = ({ log }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover className="transition-colors cursor-pointer" onClick={() => setOpen(!open)}>
        <TableCell>
          <IconButton size="small">
            {open ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" className="font-medium text-gray-800">
            {new Date(log.createdAt || log.timestamp).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {new Date(log.createdAt || log.timestamp).toLocaleTimeString()}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={log.action || "N/A"}
            color={getActionColor(log.action)}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Chip label={log.entity || log.entityType || "N/A"} size="small" variant="outlined" />
        </TableCell>
        <TableCell>
          <Typography variant="body2" className="text-gray-700">
            {log.performedBy?.firstName
              ? `${log.performedBy.firstName} ${log.performedBy.lastName || ""}`
              : log.performedBy?.email || log.userId || "System"}
          </Typography>
          {log.performedBy?.role && (
            <Typography variant="caption" className="text-gray-400">
              {log.performedBy.role}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" className="text-gray-600 truncate max-w-[200px]">
            {log.description || log.message || "—"}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box className="py-4 px-2">
              <Grid container spacing={3}>
                {/* Old Values */}
                {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} className="p-3 bg-red-50 rounded-xl border border-red-100">
                      <Typography variant="subtitle2" className="font-bold text-red-700 mb-2">
                        Previous Values
                      </Typography>
                      <pre className="text-xs text-red-800 whitespace-pre-wrap overflow-auto max-h-40">
                        {JSON.stringify(log.oldValues, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
                {/* New Values */}
                {log.newValues && Object.keys(log.newValues).length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <Typography variant="subtitle2" className="font-bold text-green-700 mb-2">
                        New Values
                      </Typography>
                      <pre className="text-xs text-green-800 whitespace-pre-wrap overflow-auto max-h-40">
                        {JSON.stringify(log.newValues, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
                {/* If no old/new values, show full details */}
                {(!log.oldValues || Object.keys(log.oldValues).length === 0) &&
                  (!log.newValues || Object.keys(log.newValues).length === 0) && (
                    <Grid item xs={12}>
                      <Paper elevation={0} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <Typography variant="subtitle2" className="font-bold text-gray-600 mb-2">
                          Details
                        </Typography>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const AuditLogs = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [entityFilter, setEntityFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: auditData, isLoading, error } = useAuditLogs({
    page: page + 1,
    limit: rowsPerPage,
    entity: entityFilter !== "All" ? entityFilter : undefined,
    action: actionFilter !== "All" ? actionFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const logs = auditData?.data || auditData || [];
  const totalCount = auditData?.total || auditData?.count || logs.length;

  if (isLoading) {
    return <LoadingSpinner message="Loading audit logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Audit Logs
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Track all system actions — users, batches, topics, and attendance changes
        </Typography>
      </div>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <div className="flex items-center gap-2 mb-3">
          <FilterIcon className="text-gray-500" />
          <Typography variant="subtitle2" className="font-semibold text-gray-700">
            Filters
          </Typography>
        </div>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Entity Type</InputLabel>
              <Select
                id="filter-entity"
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPage(0);
                }}
                label="Entity Type"
              >
                {entityTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                id="filter-action"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
                label="Action"
              >
                {actionTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              id="filter-start-date"
              fullWidth
              type="date"
              label="From"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              id="filter-end-date"
              fullWidth
              type="date"
              label="To"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Table */}
      {error ? (
        <Alert severity="error">
          Failed to load audit logs. The server may not have an audit endpoint configured.
        </Alert>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Audit Logs"
          description="No audit logs match your current filters"
          icon={AuditIcon}
        />
      ) : (
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell width={50} />
                  <TableCell className="font-semibold text-gray-600">Timestamp</TableCell>
                  <TableCell className="font-semibold text-gray-600">Action</TableCell>
                  <TableCell className="font-semibold text-gray-600">Entity</TableCell>
                  <TableCell className="font-semibold text-gray-600">Performed By</TableCell>
                  <TableCell className="font-semibold text-gray-600">Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, index) => (
                  <AuditRow key={log._id || index} log={log} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Paper>
      )}
    </div>
  );
};

export default AuditLogs;
