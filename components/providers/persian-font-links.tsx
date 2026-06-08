import {
  getDefaultPersianFontId,
  getPersianFontStylesheets,
  isPersianFontPreviewEnabled,
  PERSIAN_FONT_IDS,
} from '@/lib/persian-font';

export function PersianFontLinks() {
  const previewEnabled = isPersianFontPreviewEnabled();
  const fontIds = previewEnabled ? [...PERSIAN_FONT_IDS] : [getDefaultPersianFontId()];
  const stylesheets = getPersianFontStylesheets(fontIds);

  return (
    <>
      {stylesheets.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
    </>
  );
}
