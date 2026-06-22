import '../styles/index.css';
import dynamic from 'next/dynamic';

// The wallet provider + layout are browser-only (Reown AppKit, ethers signers,
// WalletConnect). Load them with SSR disabled so nothing Web3 runs on the server.
const Providers = dynamic(() => import('../components/Providers.jsx'), {
  ssr: false,
  loading: () => null,
});

export default function App({ Component, pageProps }) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}
