import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export const LoadingSpinner = ({ message = "Loading..." }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 8,
    }}
  >
    <CircularProgress sx={{ mb: 2 }} />
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {message}
    </Typography>
  </Box>
);

export default LoadingSpinner;
