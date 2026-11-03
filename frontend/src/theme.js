import { createTheme } from '@mui/material/styles'

export const createCampusTheme = mode => {
    const dark = mode === 'dark'
    return createTheme({
        palette: {
            mode,
            primary: { main: dark ? '#a8d5b7' : '#285b43', contrastText: dark ? '#15271c' : '#ffffff' },
            secondary: { main: dark ? '#c8b88b' : '#8a7242' },
            background: { default: dark ? '#111614' : '#f5f6f3', paper: dark ? '#191f1c' : '#ffffff' },
            text: { primary: dark ? '#edf2ed' : '#202d25', secondary: dark ? '#a3aea6' : '#717b73' },
            divider: dark ? '#2c352f' : '#e5e9e3',
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
                outlined: { borderColor: dark ? '#354139' : '#dce3da', color: dark ? '#d7e3d9' : '#45554a', '&:hover': { borderColor: dark ? '#6c8573' : '#9aac9d', background: dark ? '#253027' : '#f1f5ee' } },
            } },
            MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8, fontSize: '.875rem' }, notchedOutline: { borderColor: dark ? '#3a453e' : '#dce3da' } } },
            MuiInputLabel: { styleOverrides: { root: { fontSize: '.875rem' } } },
            MuiChip: { styleOverrides: { root: { borderRadius: 6, fontSize: '.7rem', fontWeight: 550 } } },
            MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
            MuiTableCell: { styleOverrides: { root: { borderColor: dark ? '#2c352f' : '#e5e9e3', fontSize: '.8125rem', padding: '14px 18px' }, head: { fontSize: '.6875rem', fontWeight: 600, letterSpacing: '.045em', color: dark ? '#a3aea6' : '#717b73', background: dark ? '#1d2520' : '#f8faf6' } } },
            MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 6, fontSize: '.7rem', padding: '6px 10px' } } },
        },
    })
}
