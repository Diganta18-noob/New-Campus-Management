import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
} from "@mui/material";

export const TextInput = React.forwardRef(
  ({ label, error, helperText, required, multiline, rows, ...props }, ref) => (
    <TextField
      ref={ref}
      label={label}
      error={!!error}
      helperText={helperText}
      required={required}
      fullWidth
      multiline={multiline}
      rows={rows}
      variant="outlined"
      size="small"
      {...props}
    />
  ),
);

TextInput.displayName = "TextInput";

export const SelectInput = React.forwardRef(
  (
    { label, error, helperText, required, options, value, onChange, ...props },
    ref,
  ) => (
    <FormControl fullWidth size="small" error={!!error}>
      <InputLabel>{label}</InputLabel>
      <Select
        ref={ref}
        label={label}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      >
        {options?.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  ),
);

SelectInput.displayName = "SelectInput";

export const MultiSelectInput = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required,
      options,
      value = [],
      onChange,
      renderValue,
      ...props
    },
    ref,
  ) => (
    <FormControl fullWidth size="small" error={!!error}>
      <InputLabel>{label}</InputLabel>
      <Select
        ref={ref}
        multiple
        label={label}
        value={value}
        onChange={onChange}
        required={required}
        renderValue={renderValue}
        {...props}
      >
        {options?.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  ),
);

MultiSelectInput.displayName = "MultiSelectInput";

export const DateInput = React.forwardRef(
  ({ label, error, helperText, required, ...props }, ref) => (
    <TextField
      ref={ref}
      label={label}
      type="date"
      error={!!error}
      helperText={helperText}
      required={required}
      fullWidth
      variant="outlined"
      size="small"
      InputLabelProps={{ shrink: true }}
      {...props}
    />
  ),
);

DateInput.displayName = "DateInput";

export const CheckboxInput = React.forwardRef(
  ({ label, checked, onChange, ...props }, ref) => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ width: 18, height: 18, cursor: "pointer" }}
        {...props}
      />
      {label && (
        <Typography
          sx={{ ml: 1, cursor: "pointer" }}
          onClick={(e) => {
            const input = ref.current;
            if (input) {
              input.checked = !input.checked;
              onChange?.({ target: input });
            }
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  ),
);

CheckboxInput.displayName = "CheckboxInput";
