import './globals.css';
import FacebookPixel from '@/components/FacebookPixel';

export const metadata = {
  title: 'SoundPro X9 ওয়্যারলেস হেডফোন — অর্ডার করুন',
  description:
    'SoundPro X9 ওয়্যারলেস হেডফোন — ৪০ ঘণ্টা ব্যাটারি ব্যাকআপ, ডিপ বেস, Bluetooth 5.3। ক্যাশ অন ডেলিভারিতে সারাদেশে হোম ডেলিভারি।',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <FacebookPixel />
        {children}
      </body>
    </html>
  );
}
