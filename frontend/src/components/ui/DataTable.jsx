import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    TextField,
    InputAdornment,
    Box,
    Typography,
} from '@mui/material'
import { Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, InboxOutlined as InboxIcon } from '@mui/icons-material'

const DataTable = ({ columns, data = [], onEdit, onDelete, searchable = true, searchLabel = 'Search records', emptyMessage = 'No records yet' }) => {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter data based on search query
    const filteredData = searchQuery
        ? data.filter((row) =>
            columns.some((column) => {
                const value = row[column.field]
                if (value === null || value === undefined) return false
                return String(value).toLowerCase().includes(searchQuery.toLowerCase())
            })
        )
        : data

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
            }}
        >
            {searchable && (
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField
                        size="small"
                        label={searchLabel}
                        className="w-full max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}
            <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 560 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.field}
                                    scope="col"
                                    sx={{
                                        fontWeight: 600,
                                        color: 'text.secondary',
                                    }}
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                            {(onEdit || onDelete) && (
                                <TableCell scope="col" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                                    sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}
                                >
                                    <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1 }}>
                                        <InboxIcon color="primary" fontSize="large" aria-hidden="true" />
                                        <Typography fontWeight={650}>{searchQuery ? 'No matching records' : emptyMessage}</Typography>
                                        <Typography variant="body2" color="text.secondary">{searchQuery ? 'Try another search term.' : 'Records will appear here when available.'}</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((row, index) => (
                                <TableRow
                                    key={row._id || row.id || index}
                                    sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                        transition: 'background-color 0.15s',
                                    }}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column.field}>
                                            {column.renderCell ? column.renderCell(row) : row[column.field]}
                                        </TableCell>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {onEdit && (
                                                    <IconButton
                                                        size="small"
                                                        aria-label={`Edit ${row.name || row.title || row.firstName || 'record'}`}
                                                        onClick={() => onEdit(row)}
                                                        sx={{ color: 'primary.main' }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                {onDelete && (
                                                    <IconButton
                                                        size="small"
                                                        aria-label={`Delete ${row.name || row.title || row.firstName || 'record'}`}
                                                        onClick={() => onDelete(row)}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default DataTable
