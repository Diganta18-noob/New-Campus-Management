/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans Variable', 'DM Sans', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#f1f6f0',
                    100: '#e3eedf',
                    200: '#cddfc6',
                    300: '#a9c4a2',
                    400: '#7ca279',
                    500: '#527d58',
                    600: '#3b6243',
                    700: '#2a4c34',
                    800: '#203c2a',
                    900: '#182e21',
                },
            },
        },
    },
    plugins: [],
}
