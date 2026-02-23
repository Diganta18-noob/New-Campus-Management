import React from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              gap: 3,
            }}
          >
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                width: "100%",
              }}
            >
              <ErrorIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
              <Typography
                variant="h4"
                component="h1"
                sx={{ mb: 2, fontWeight: "bold" }}
              >
                Something went wrong
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 3, color: "text.secondary" }}
              >
                An unexpected error occurred. Please try again or contact
                support if the problem persists.
              </Typography>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    backgroundColor: "#f5f5f5",
                    textAlign: "left",
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    {this.state.error.toString()}
                    {"\n\n"}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button variant="contained" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => (window.location.href = "/")}
                >
                  Go Home
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
