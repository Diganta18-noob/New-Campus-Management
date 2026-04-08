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
} from '@mui/material'
import { Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'

const DataTable = ({ columns, data, onEdit, onDelete, searchable = true }) => {
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
                <div className="p-4" style={{ borderBottom: '1px solid var(--divider-color, #e0e0e0)' }}>
                    <TextField
                        size="small"
                        placeholder="Search..."
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
                </div>
            )}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow
                            sx={{
                                bgcolor: (theme) =>
                                    theme.palette.mode === 'dark'
                                        ? 'rgba(30, 41, 59, 0.8)'
                                        : '#f9fafb',
                            }}
                        >
                            {columns.map((column) => (
                                <TableCell
                                    key={column.field}
                                    sx={{
                                        fontWeight: 600,
                                        color: 'text.secondary',
                                    }}
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                            {(onEdit || onDelete) && (
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                                    sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}
                                >
                                    {searchQuery ? 'No results found' : 'No data available'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((row, index) => (
                                <TableRow
                                    key={row.id || index}
                                    sx={{
                                        '&:hover': {
                                            bgcolor: (theme) =>
                                                theme.palette.mode === 'dark'
                                                    ? 'rgba(30, 41, 59, 0.5)'
                                                    : '#f9fafb',
                                        },
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
                                                        onClick={() => onEdit(row)}
                                                        sx={{ color: 'primary.main' }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                {onDelete && (
                                                    <IconButton
                                                        size="small"
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
