import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  LinearProgress,
} from "@mui/material";

export const DashboardCard = ({ title, subtitle, children, icon: Icon }) => (
  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <CardHeader
      avatar={Icon && <Icon sx={{ fontSize: 40, color: "primary.main" }} />}
      title={title}
      subheader={subtitle}
      titleTypographyProps={{ variant: "h6" }}
    />
    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {children}
    </CardContent>
  </Card>
);

export const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "primary",
  trend,
}) => (
  <Card>
    <CardContent
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography color="textSecondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          {value}
        </Typography>
        {trend && (
          <Typography
            variant="caption"
            sx={{
              color: trend > 0 ? "success.main" : "error.main",
              fontWeight: "bold",
            }}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </Typography>
        )}
      </Box>
      {Icon && (
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: "50%",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
        </Box>
      )}
    </CardContent>
  </Card>
);

export const AttendanceGaugeCard = ({ percentage, label }) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
        <Box sx={{ position: "relative", display: "inline-flex", mr: 2 }}>
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={100}
            sx={{
              color:
                percentage >= 75
                  ? "success.main"
                  : percentage >= 50
                    ? "warning.main"
                    : "error.main",
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {percentage}%
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" color="textSecondary">
            Attendance
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {percentage >= 75
              ? "✓ Good"
              : percentage >= 50
                ? "! Fair"
                : "✗ Poor"}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const ProgressCard = ({ label, value, max, color = "primary" }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography color="textSecondary">{label}</Typography>
        <Typography sx={{ fontWeight: "bold" }}>
          {value} / {max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(value / max) * 100}
        sx={{ height: 8 }}
      />
    </CardContent>
  </Card>
);

export const ListCard = ({
  title,
  items,
  emptyMessage = "No items",
  maxItems = 5,
}) => (
  <Card>
    <CardHeader title={title} titleTypographyProps={{ variant: "h6" }} />
    <CardContent>
      {items && items.length > 0 ? (
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          {items.slice(0, maxItems).map((item, index) => (
            <Typography component="li" key={index} sx={{ py: 0.5 }}>
              {item}
            </Typography>
          ))}
          {items.length > maxItems && (
            <Typography
              component="li"
              sx={{ py: 0.5, fontStyle: "italic", color: "text.secondary" }}
            >
              +{items.length - maxItems} more...
            </Typography>
          )}
        </Box>
      ) : (
        <Typography color="textSecondary">{emptyMessage}</Typography>
      )}
    </CardContent>
  </Card>
);

// Import CircularProgress here
import { CircularProgress } from "@mui/material";
