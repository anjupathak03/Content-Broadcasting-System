window.onload = () => {
  window.ui = SwaggerUIBundle({
    url: '/docs/openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset,
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl,
    ],
    layout: 'StandaloneLayout',
  });
};
