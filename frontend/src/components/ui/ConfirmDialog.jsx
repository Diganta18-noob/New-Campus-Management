import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
} from '@mui/material'
import {
    Warning as WarningIcon,
    Close as CloseIcon,
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material'

/**
 * Reusable MUI Confirmation Dialog
 *
 * @param {boolean} open - Whether the dialog is visible
 * @param {function} onClose - Called when user cancels
 * @param {function} onConfirm - Called when user confirms
 * @param {string} title - Dialog title (e.g. "Delete Department")
 * @param {string} message - Body message
 * @param {string} confirmText - Confirm button label (default: "Delete")
 * @param {string} cancelText - Cancel button label (default: "Cancel")
 * @param {string} severity - "error" | "warning" | "info" (controls icon & button color)
 * @param {boolean} loading - Show loading state on confirm button
 */
const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    severity = 'error',
    loading = false,
}) => {
    const colorMap = {
        error: { bg: '#FEE2E2', icon: '#EF4444', btn: '#EF4444', hoverBtn: '#DC2626' },
        warning: { bg: '#FEF3C7', icon: '#F59E0B', btn: '#F59E0B', hoverBtn: '#D97706' },
        info: { bg: '#DBEAFE', icon: '#3B82F6', btn: '#3B82F6', hoverBtn: '#2563EB' },
    }

    const colors = colorMap[severity] || colorMap.error

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle sx={{ pb: 0, pt: 3, px: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                backgroundColor: colors.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {severity === 'error' ? (
                                <DeleteIcon sx={{ color: colors.icon, fontSize: 24 }} />
                            ) : (
                                <WarningIcon sx={{ color: colors.icon, fontSize: 24 }} />
                            )}
                        </Box>
                        <Typography variant="h6" fontWeight={600} fontSize="1.1rem">
                            {title}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ pl: 7, lineHeight: 1.6 }}
                >
                    {message}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        color: '#6B7280',
                        borderColor: '#E5E7EB',
                        '&:hover': { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
                        px: 3,
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        backgroundColor: colors.btn,
                        '&:hover': { backgroundColor: colors.hoverBtn },
                        boxShadow: 'none',
                        px: 3,
                    }}
                >
                    {loading ? 'Please wait...' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ConfirmDialog
