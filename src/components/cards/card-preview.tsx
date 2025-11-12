'use client';

import { useMemo } from 'react';

import type { RenderedCardData } from '@/types/vcard';

interface CardPreviewProps {
  html: string;
  css?: string | null;
  js?: string | null;
  data: RenderedCardData;
  meta?: Record<string, unknown>;
}

const removeAssetReference = (html: string) =>
  html
    .replace(/<link[^>]*styles\.css[^>]*>/gi, '')
    .replace(/<script[^>]*script\.js[^>]*><\/script>/gi, '');

export function CardPreviewFrame({
  html,
  css,
  js,
  data,
  meta,
}: CardPreviewProps) {
  const documentString = useMemo(() => {
    const sanitizedHtml = removeAssetReference(html);
    const styleBlock = css ? `<style>${css}</style>` : '';
    const scriptBlock = js ? `<script>${js}</script>` : '';
    const dataScript = `<script>window.vcardData = ${JSON.stringify(data)};</script>`;
    const metaScript = meta
      ? `<script>window.vcardMeta = ${JSON.stringify(meta)};</script>`
      : '';

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
    ${metaScript}
    ${scriptBlock}
  </body>
</html>`;
  }, [html, css, js, data, meta]);

  return (
    <iframe
      title="Digital Card Preview"
      srcDoc={documentString}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-downloads"
      style={{
        width: '100%',
        minHeight: '100vh',
        border: 'none',
        backgroundColor: '#fff',
      }}
    />
  );
}

