// Texto con formato (descripción de las audiciones): un subconjunto de Markdown
// guardado tal cual en la columna de texto. Lo que no es sintaxis se ve como se escribió.

// Botones de la barra del editor.
export const RichTextFormat = {
  HEADING_2: 'heading2',
  HEADING_3: 'heading3',
  BOLD: 'bold',
  ITALIC: 'italic',
  BULLET_LIST: 'bulletList',
  NUMBERED_LIST: 'numberedList',
  LINK: 'link',
} as const;
export type RichTextFormat = (typeof RichTextFormat)[keyof typeof RichTextFormat];

// Marcas que escribe la barra. El lector acepta además "#", "*" y "•" como viñeta, y "1)".
export const RICH_TEXT_MARKS = {
  BOLD: '**',
  ITALIC: '*',
  HEADING_2: '## ',
  HEADING_3: '### ',
  BULLET: '- ',
} as const;

// Lo que pone la barra al crear un enlace, seleccionado para sobrescribirlo.
export const RICH_TEXT_LINK_PLACEHOLDER = { LABEL: 'link text', URL: 'https://' } as const;

// Viñeta con la que se pinta (y se exporta a texto plano) cualquier lista sin números.
export const RICH_TEXT_BULLET = '•';

// Bloques en los que se lee el texto.
export const RichTextBlockType = {
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  LIST: 'list',
} as const;
