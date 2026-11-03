import { createTheme } from '@mui/material/styles'

export const createCampusTheme = mode => {
    const dark = mode === 'dark'
    return createTheme({
        palette: {
            mode,
            primary: { main: '#2563EB', contrastText: '#ffffff' },
            secondary: { main: '#60A5FA' },
            background: { default: dark ? '#081426' : '#F0F7FF', paper: dark ? '#0B1F3B' : '#ffffff' },
            text: { primary: dark ? '#F0F7FF' : '#0B1F3B', secondary: dark ? '#AFC6E1' : '#526984' },
            divider: dark ? '#233D60' : '#D2E2F5',
            success: { main: dark ? '#9dccab' : '#397957' },
        },
        shape: { borderRadius: 12 },
        typography: {
            fontFamily: '"DM Sans Variable", "DM Sans", system-ui, sans-serif',
            fontSize: 13,
            h1: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-.055em', lineHeight: 1.2 },
            h2: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-.04em' },
            h3: { fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-.035em' },
            h4: { fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-.045em' },
            h5: { fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-.025em' },
            h6: { fontSize: '1rem', fontWeight: 600, letterSpacing: '-.02em' },
            body1: { fontSize: '.875rem', lineHeight: 1.65 },
            body2: { fontSize: '.8125rem', lineHeight: 1.6 },
            button: { fontWeight: 550, letterSpacing: '-.01em', textTransform: 'none' },
        },
        components: {
            MuiCssBaseline: { styleOverrides: { body: { fontFeatureSettings: '"ss01" on', WebkitFontSmoothing: 'antialiased' } } },
            MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
            MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
                root: { borderRadius: 8, padding: '9px 15px', fontSize: '.8125rem', boxShadow: 'none', minHeight: 38 },
                outlined: { borderColor: dark ? '#315074' : '#C7DBF4', color: dark ? '#DBEAFE' : '#274361', '&:hover': { borderColor: dark ? '#60A5FA' : '#60A5FA', background: dark ? '#15345C' : '#DBEAFE' } },
            } },
            MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8, fontSize: '.875rem' }, notchedOutline: { borderColor: dark ? '#315074' : '#C7DBF4' } } },
            MuiInputLabel: { styleOverrides: { root: { fontSize: '.875rem' } } },
            MuiChip: { styleOverrides: { root: { borderRadius: 6, fontSize: '.7rem', fontWeight: 550 } } },
            MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
            MuiTableCell: { styleOverrides: { root: { borderColor: dark ? '#233D60' : '#D2E2F5', fontSize: '.8125rem', padding: '14px 18px' }, head: { fontSize: '.6875rem', fontWeight: 600, letterSpacing: '.045em', color: dark ? '#AFC6E1' : '#526984', background: dark ? '#102747' : '#F0F7FF' } } },
            MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 6, fontSize: '.7rem', padding: '6px 10px' } } },
        },
    })
}
