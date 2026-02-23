import React from "react";
import { Box, Typography, Button } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

export const EmptyState = ({
  icon: Icon = InboxIcon,
  title = "No data found",
  description = "There is nothing to display right now",
  action,
  actionLabel = "Add New",
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 8,
      px: 2,
    }}
  >
    <Icon sx={{ fontSize: 80, color: "text.secondary", mb: 2, opacity: 0.5 }} />
    <Typography variant="h6" sx={{ mb: 1, color: "text.primary" }}>
      {title}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        mb: 3,
        color: "text.secondary",
        maxWidth: 400,
        textAlign: "center",
      }}
    >
      {description}
    </Typography>
    {action && (
      <Button variant="contained" onClick={action}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
