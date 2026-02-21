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
        <Paper elevation={0} className="rounded-2xl border border-gray-100 overflow-hidden">
            {searchable && (
                <div className="p-4 border-b border-gray-100">
                    <TextField
                        size="small"
                        placeholder="Search..."
                        className="w-full max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon className="text-gray-400" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </div>
            )}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow className="bg-gray-50">
                            {columns.map((column) => (
                                <TableCell
                                    key={column.field}
                                    className="font-semibold text-gray-700"
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                            {(onEdit || onDelete) && (
                                <TableCell className="font-semibold text-gray-700">Actions</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                                    className="text-center py-8 text-gray-500"
                                >
                                    {searchQuery ? 'No results found' : 'No data available'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((row, index) => (
                                <TableRow
                                    key={row.id || index}
                                    className="hover:bg-gray-50 transition-colors"
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
                                                        className="text-primary-500 hover:bg-primary-50"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                {onDelete && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onDelete(row)}
                                                        className="text-red-500 hover:bg-red-50"
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
