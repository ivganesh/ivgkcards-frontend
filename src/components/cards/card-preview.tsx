'use client';

import { useMemo } from 'react';

interface CardPreviewProps {
  html: string;
  css?: string | null;
  js?: string | null;
  data: unknown;
}

const removeAssetReference = (html: string) =>
  html
    .replace(/<link[^>]*styles\.css[^>]*>/gi, '')
    .replace(/<script[^>]*script\.js[^>]*><\/script>/gi, '');

export function CardPreviewFrame({ html, css, js, data }: CardPreviewProps) {
  const documentString = useMemo(() => {
    const sanitizedHtml = removeAssetReference(html);
    const styleBlock = css ? `<style>${css}</style>` : '';
    const scriptBlock = js ? `<script>${js}</script>` : '';
    const dataScript = `<script>window.vcardData = ${JSON.stringify(data)};</script>`;

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${styleBlock}
  </head>
  <body>
    ${sanitizedHtml}
    ${dataScript}
    ${scriptBlock}
  </body>
</html>`;
  }, [html, css, js, data]);

  return (
    <iframe
      title="Digital Card Preview"
      srcDoc={documentString}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      style={{
        width: '100%',
        minHeight: '100vh',
        border: 'none',
        backgroundColor: '#fff',
      }}
    />
  );
}

