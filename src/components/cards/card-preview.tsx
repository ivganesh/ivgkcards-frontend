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
    const fallbackScript = `<script>
(function () {
  try {
    const data = window.vcardData || {};
    const alreadyRendered = document.body.getAttribute('data-ivgk-sections-rendered') === 'true';
    if (!data || alreadyRendered) {
      return;
    }

    const hasContent =
      (Array.isArray(data.services) && data.services.length) ||
      (Array.isArray(data.products) && data.products.length) ||
      (Array.isArray(data.galleries) && data.galleries.length) ||
      (Array.isArray(data.testimonials) && data.testimonials.length) ||
      (Array.isArray(data.businessHours) && data.businessHours.length) ||
      (Array.isArray(data.appointments) && data.appointments.length) ||
      (Array.isArray(data.customLinks) && data.customLinks.length) ||
      data.locationUrl ||
      data.locationEmbedTag ||
      (data.qrCode && data.qrCode.imageDataUrl);

    if (!hasContent) {
      return;
    }

    const styleId = 'ivgk-fallback-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = \`
        .ivgk-dynamic-section {
          margin: 20px 0;
          padding: 20px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
          color: #1f2937;
          font-family: inherit;
        }
        .ivgk-dynamic-section h2 {
          margin: 0 0 16px 0;
          font-size: 17px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(17, 24, 39, 0.68);
        }
        .ivgk-dynamic-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        .ivgk-dynamic-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ivgk-dynamic-card img {
          width: 100%;
          height: 130px;
          border-radius: 12px;
          object-fit: cover;
        }
        .ivgk-dynamic-badge {
          align-self: flex-start;
          padding: 6px 10px;
          border-radius: 999px;
          background: linear-gradient(120deg, #4c51bf, #805ad5);
          color: #fff;
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .ivgk-dynamic-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }
        .ivgk-dynamic-list-item {
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(79, 70, 229, 0.08);
          font-size: 14px;
          color: rgba(17, 24, 39, 0.76);
        }
        .ivgk-dynamic-links {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ivgk-dynamic-links a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 12px;
          background: rgba(79, 70, 229, 0.12);
          border: 1px solid rgba(79, 70, 229, 0.16);
          color: #4338ca;
          text-decoration: none;
          font-size: 13px;
        }
        .ivgk-dynamic-map {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.1);
        }
        .ivgk-dynamic-map iframe {
          width: 100%;
          height: 240px;
          border: 0;
        }
        .ivgk-dynamic-qr {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }
        .ivgk-dynamic-qr img {
          width: 148px;
          height: 148px;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
        }
        .ivgk-dynamic-qr-info {
          flex: 1 1 200px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ivgk-dynamic-qr-link {
          font-family: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 12px;
          background: rgba(79, 70, 229, 0.1);
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid rgba(79, 70, 229, 0.2);
          color: #3730a3;
          word-break: break-all;
        }
        .ivgk-dynamic-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .ivgk-dynamic-button {
          border: none;
          border-radius: 999px;
          padding: 10px 18px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .ivgk-dynamic-button.primary {
          background: #4c51bf;
          color: #fff;
          box-shadow: 0 16px 28px rgba(79, 70, 229, 0.22);
        }
        .ivgk-dynamic-button.secondary {
          background: #fff;
          color: #4338ca;
          border: 1px solid rgba(79, 70, 229, 0.2);
        }
        @media (max-width: 640px) {
          .ivgk-dynamic-qr {
            flex-direction: column;
            align-items: flex-start;
          }
          .ivgk-dynamic-qr img {
            width: 132px;
            height: 132px;
          }
        }
      \`;
      document.head.appendChild(style);
    }

    const container =
      document.querySelector('[data-dynamic-sections]') ||
      document.querySelector('main') ||
      document.querySelector('.content') ||
      document.body;

    const anchor =
      (container && container.querySelector('[data-dynamic-anchor]')) ||
      (container && container.lastElementChild);

    function insertSection(section) {
      if (!container) return;
      if (anchor && anchor.parentElement === container) {
        container.insertBefore(section, anchor.nextSibling);
      } else {
        container.appendChild(section);
      }
    }

    function buildSection(title, id) {
      const section = document.createElement('section');
      section.className = 'ivgk-dynamic-section';
      if (id) {
        section.id = id;
      }
      const heading = document.createElement('h2');
      heading.textContent = title;
      section.appendChild(heading);
      return section;
    }

    function renderServices(items) {
      if (!Array.isArray(items) || !items.length) return;
      const section = buildSection('Services', 'fallbackServices');
      const grid = document.createElement('div');
      grid.className = 'ivgk-dynamic-grid';

      items
        .filter(Boolean)
        .forEach((item) => {
          const card = document.createElement('article');
          card.className = 'ivgk-dynamic-card';
          if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title || 'Service image';
            card.appendChild(img);
          }
          const title = document.createElement('h3');
          title.textContent = item.title || 'Service';
          card.appendChild(title);
          if (item.description) {
            const description = document.createElement('p');
            description.textContent = item.description;
            card.appendChild(description);
          }
          if (item.price !== undefined && item.price !== null) {
            const badge = document.createElement('span');
            badge.className = 'ivgk-dynamic-badge';
            badge.textContent = '₹' + Number(item.price).toLocaleString();
            card.appendChild(badge);
          }
          grid.appendChild(card);
        });

      if (!grid.children.length) return;
      section.appendChild(grid);
      insertSection(section);
    }

    function renderProducts(items) {
      if (!Array.isArray(items) || !items.length) return;
      const section = buildSection('Products & Packages', 'fallbackProducts');
      const grid = document.createElement('div');
      grid.className = 'ivgk-dynamic-grid';

      items
        .filter(Boolean)
        .forEach((item) => {
          const card = document.createElement('article');
          card.className = 'ivgk-dynamic-card';
          if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name || 'Product image';
            card.appendChild(img);
          }
          const title = document.createElement('h3');
          title.textContent = item.name || 'Product';
          card.appendChild(title);
          if (item.description) {
            const description = document.createElement('p');
            description.textContent = item.description;
            card.appendChild(description);
          }
          const price = document.createElement('span');
          price.className = 'ivgk-dynamic-badge';
          const symbol = item.currency?.symbol || '';
          price.textContent = symbol + Number(item.price ?? 0).toLocaleString();
          card.appendChild(price);
          grid.appendChild(card);
        });

      if (!grid.children.length) return;
      section.appendChild(grid);
      insertSection(section);
    }

    function renderGallery(items) {
      if (!Array.isArray(items) || !items.length) return;
      const section = buildSection('Gallery', 'fallbackGallery');
      const grid = document.createElement('div');
      grid.className = 'ivgk-dynamic-grid';

      items
        .filter((item) => item && item.imageUrl)
        .forEach((item) => {
          const card = document.createElement('figure');
          card.className = 'ivgk-dynamic-card';
          const img = document.createElement('img');
          img.src = item.imageUrl;
          img.alt = item.title || 'Gallery image';
          card.appendChild(img);
          if (item.title) {
            const caption = document.createElement('figcaption');
            caption.textContent = item.title;
            card.appendChild(caption);
          }
          grid.appendChild(card);
        });

      if (!grid.children.length) return;
      section.appendChild(grid);
      insertSection(section);
    }

    function renderTestimonials(items) {
      if (!Array.isArray(items) || !items.length) return;
      const section = buildSection('Testimonials', 'fallbackTestimonials');
      const grid = document.createElement('div');
      grid.className = 'ivgk-dynamic-grid';

      items
        .filter((item) => item && (item.content || item.name))
        .forEach((item) => {
          const card = document.createElement('article');
          card.className = 'ivgk-dynamic-card';
          if (item.imageUrl) {
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.name || 'Client portrait';
            card.appendChild(img);
          }
          if (item.content) {
            const quote = document.createElement('p');
            quote.textContent = item.content;
            card.appendChild(quote);
          }
          const author = document.createElement('strong');
          author.textContent = item.name || 'Client';
          card.appendChild(author);
          if (item.company) {
            const company = document.createElement('span');
            company.textContent = item.company;
            card.appendChild(company);
          }
          grid.appendChild(card);
        });

      if (!grid.children.length) return;
      section.appendChild(grid);
      insertSection(section);
    }

    function renderBusinessHours(items) {
      if (!Array.isArray(items) || !items.length) return;
      const openDays = items.filter((entry) => entry.isOpen);
      if (!openDays.length) return;

      const section = buildSection('Business Hours', 'fallbackHours');
      const list = document.createElement('ul');
      list.className = 'ivgk-dynamic-list';
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      openDays.forEach((entry) => {
        const item = document.createElement('li');
        item.className = 'ivgk-dynamic-list-item';
        const day = days[entry.dayOfWeek ?? 0] || 'Day';
        const open = entry.openTime || '09:00';
        const close = entry.closeTime || '18:00';
        item.textContent = \`\${day}: \${open} – \${close}\`;
        list.appendChild(item);
      });

      section.appendChild(list);
      insertSection(section);
    }

    function renderAppointments(items) {
      if (!Array.isArray(items) || !items.length) return;
      const available = items.filter((slot) => slot.available);
      if (!available.length) return;

      const section = buildSection('Appointments', 'fallbackAppointments');
      const list = document.createElement('div');
      list.className = 'ivgk-dynamic-grid';

      available.forEach((slot) => {
        const card = document.createElement('article');
        card.className = 'ivgk-dynamic-card';
        const title = document.createElement('h3');
        title.textContent = slot.title || 'Session';
        card.appendChild(title);
        const meta = document.createElement('span');
        const duration = \`\${slot.duration ?? 30} mins\`;
        const price =
          slot.price === undefined || slot.price === null
            ? 'Free'
            : '₹' + Number(slot.price).toLocaleString();
        meta.textContent = \`\${duration} • \${price}\`;
        card.appendChild(meta);
        if (slot.description) {
          const description = document.createElement('p');
          description.textContent = slot.description;
          card.appendChild(description);
        }
        list.appendChild(card);
      });

      section.appendChild(list);
      insertSection(section);
    }

    function renderCustomLinks(items) {
      if (!Array.isArray(items) || !items.length) return;
      const section = buildSection('Quick Links', 'fallbackLinks');
      const list = document.createElement('div');
      list.className = 'ivgk-dynamic-links';

      items
        .filter((link) => link && link.url && link.label)
        .forEach((link) => {
          const anchor = document.createElement('a');
          anchor.href = link.url;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.textContent = link.label;
          list.appendChild(anchor);
        });

      if (!list.children.length) return;
      section.appendChild(list);
      insertSection(section);
    }

    function renderMap(dataObj) {
      if (!dataObj.locationEmbedTag && !dataObj.locationUrl) return;
      const section = buildSection('Find Us', 'fallbackMap');
      const wrapper = document.createElement('div');
      wrapper.className = 'ivgk-dynamic-map';

      if (dataObj.locationEmbedTag) {
        wrapper.innerHTML = dataObj.locationEmbedTag;
      } else if (dataObj.locationUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = dataObj.locationUrl;
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        wrapper.appendChild(iframe);
      }

      section.appendChild(wrapper);
      insertSection(section);
    }

    function renderQrCode(qrCode) {
      if (!qrCode || !qrCode.imageDataUrl) return;
      const section = buildSection('Share this card', 'fallbackQr');
      const container = document.createElement('div');
      container.className = 'ivgk-dynamic-qr';

      const img = document.createElement('img');
      img.src = qrCode.imageDataUrl;
      img.alt = 'QR code for this digital card';
      container.appendChild(img);

      const info = document.createElement('div');
      info.className = 'ivgk-dynamic-qr-info';
      const description = document.createElement('p');
      description.textContent =
        'Scan to save or share this digital card instantly across any device.';
      const url = document.createElement('p');
      url.className = 'ivgk-dynamic-qr-link';
      url.textContent = qrCode.url;

      const actions = document.createElement('div');
      actions.className = 'ivgk-dynamic-actions';

      const download = document.createElement('button');
      download.type = 'button';
      download.className = 'ivgk-dynamic-button primary';
      download.textContent = 'Download QR';
      download.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = qrCode.imageDataUrl;
        link.download = qrCode.downloadFileName || 'digital-card-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'ivgk-dynamic-button secondary';
      copy.textContent = 'Copy link';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(qrCode.url);
        } catch (error) {
          console.error('Failed to copy QR link', error);
          alert('Copy this link: ' + qrCode.url);
        }
      });

      actions.appendChild(download);
      actions.appendChild(copy);
      info.appendChild(description);
      info.appendChild(url);
      info.appendChild(actions);
      container.appendChild(info);
      section.appendChild(container);
      insertSection(section);
    }

    const sections = data.sections || {};

    if (sections.services !== false) {
      renderServices(data.services);
    }
    if (sections.products !== false) {
      renderProducts(data.products);
    }
    if (sections.galleries !== false) {
      renderGallery(data.galleries);
    }
    if (sections.testimonials !== false) {
      renderTestimonials(data.testimonials);
    }
    if (sections.businessHours !== false) {
      renderBusinessHours(data.businessHours);
    }
    if (sections.appointments !== false) {
      renderAppointments(data.appointments);
    }
    if (sections.map !== false) {
      renderMap(data);
    }
    renderCustomLinks(data.customLinks);
    renderQrCode(data.qrCode);

    document.body.setAttribute('data-ivgk-sections-rendered', 'true');
  } catch (error) {
    console.error('Failed to render fallback sections', error);
  }
})();
</script>`;

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
    ${fallbackScript}
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

