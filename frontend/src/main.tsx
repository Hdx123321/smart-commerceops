import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import App from './App';
import './styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          // --- Shopifi DESIGN.md tokens ---
          colorPrimary: '#000000',           // {colors.primary}
          borderRadius: 8,                   // {rounded.md} — inputs
          borderRadiusLG: 12,                // {rounded.lg} — cards
          fontFamily: "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          colorBgLayout: '#fbfbf5',          // {colors.canvas-cream}
          colorBgContainer: '#ffffff',       // {colors.canvas-light}
          colorBorder: '#e4e4e7',            // {colors.hairline-light}
          colorBorderSecondary: '#e4e4e7',
          colorText: '#000000',              // {colors.ink}
          colorTextSecondary: '#71717a',     // {colors.shade-50}
          colorSuccess: '#c1fbd4',           // near {colors.aloe-10}
          fontSize: 16,                      // {typography.body-md}
          lineHeight: 1.5,
          padding: 16,                       // {spacing.lg}
          paddingSM: 12,                     // {spacing.md}
          paddingXS: 8,                      // {spacing.sm}
        },
        components: {
          Button: {
            borderRadius: 9999,              // {rounded.pill}
            borderRadiusLG: 9999,
            borderRadiusSM: 9999,
            primaryShadow: 'none',
            defaultShadow: 'none',
          },
          Tag: {
            borderRadiusSM: 9999,            // {rounded.pill}
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>
);
