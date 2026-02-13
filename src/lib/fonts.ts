import { Noto_Sans_JP, Playfair_Display } from 'next/font/google';

export const fontSans = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const fontBody = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-body',
});

export const fontHeading = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
});
