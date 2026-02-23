import React from "react";
import { Box, Grid, CircularProgress } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import {
  TextInput,
  SelectInput,
  MultiSelectInput,
  DateInput,
  CheckboxInput,
} from "./FormInputs";

export const FormBuilder = React.forwardRef(
  (
    {
      fields,
      onSubmit,
      defaultValues,
      isLoading,
      submitLabel = "Submit",
      cancelLabel = "Cancel",
      onCancel,
      columns = 1,
      gap = 2,
    },
    ref,
  ) => {
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm({
      defaultValues,
    });

    return (
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        ref={ref}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Grid container spacing={gap}>
          {fields.map((field) => (
            <Grid item xs={12} sm={12 / columns} key={field.name}>
              <Controller
                name={field.name}
                control={control}
                rules={field.rules}
                render={({ field: fieldProps }) => {
                  const fieldError = errors[field.name];

                  if (
                    field.type === "text" ||
                    field.type === "email" ||
                    field.type === "number" ||
                    field.type === "password"
                  ) {
                    return (
                      <TextInput
                        {...fieldProps}
                        label={field.label}
                        type={field.type || "text"}
                        error={!!fieldError}
                        helperText={fieldError?.message}
                        required={field.required}
                        multiline={field.multiline}
                        rows={field.rows}
                        disabled={isLoading}
                      />
                    );
                  }

                  if (field.type === "select") {
                    return (
                      <SelectInput
                        {...fieldProps}
                        label={field.label}
                        options={field.options}
                        error={!!fieldError}
                        helperText={fieldError?.message}
                        required={field.required}
                        disabled={isLoading}
                      />
                    );
                  }

                  if (field.type === "multiselect") {
                    return (
                      <MultiSelectInput
                        {...fieldProps}
                        label={field.label}
                        options={field.options}
                        error={!!fieldError}
                        helperText={fieldError?.message}
                        required={field.required}
                        disabled={isLoading}
                        renderValue={field.renderValue}
                      />
                    );
                  }

                  if (field.type === "date") {
                    return (
                      <DateInput
                        {...fieldProps}
                        label={field.label}
                        error={!!fieldError}
                        helperText={fieldError?.message}
                        required={field.required}
                        disabled={isLoading}
                      />
                    );
                  }

                  if (field.type === "checkbox") {
                    return (
                      <CheckboxInput
                        {...fieldProps}
                        label={field.label}
                        checked={fieldProps.value}
                        disabled={isLoading}
                      />
                    );
                  }

                  if (field.render) {
                    return field.render({
                      ...fieldProps,
                      error: !!fieldError,
                      helperText: fieldError?.message,
                    });
                  }

                  return null;
                }}
              />
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#3b82f6",
              color: "white",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isLoading && <CircularProgress size={16} color="inherit" />}
            {submitLabel}
          </button>
        </Box>
      </Box>
    );
  },
);

FormBuilder.displayName = "FormBuilder";
