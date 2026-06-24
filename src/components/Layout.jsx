// Shared layout — common Navbar (header) and Footer across all pages.
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import ConnectionToast from './ConnectionToast.jsx';

export default function Layout({ children }) {
  const router = useRouter();

  // Scroll to top on route changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [router.pathname]);

  return (
    <div id="top">
      <Navbar />
      <main className="page-main">{children}</main>
      <Footer />
      <ConnectionToast />
    </div>
  );
}
