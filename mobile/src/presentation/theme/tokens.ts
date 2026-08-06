export const ThemeTokens = {
  colors: {
    background: "#0f172a", // slate-900
    surface: "#1e293b", // slate-800
    surfaceElevated: "#334155", // slate-700
    border: "#334155",
    borderSubtle: "rgba(255, 255, 255, 0.1)",

    brand: {
      primary: "#3b82f6", // brand-500
      hover: "#2563eb", // brand-600
      active: "#1d4ed8", // brand-700
      subtle: "rgba(59, 130, 246, 0.15)",
    },

    text: {
      primary: "#f8fafc", // slate-50
      secondary: "#94a3b8", // slate-400
      muted: "#64748b", // slate-500
      inverse: "#0f172a",
    },

    status: {
      success: "#10b981", // emerald-500
      warning: "#f59e0b", // amber-500
      error: "#ef4444", // red-500
      info: "#3b82f6",
    },
  },

  typography: {
    fontFamily: {
      sans: "System, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      heading: 32,
    },
    fontWeight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
} as const;

export type ThemeTokensType = typeof ThemeTokens;
