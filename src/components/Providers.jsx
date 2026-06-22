// Client-only app shell: wallet context + shared layout.
// Loaded via next/dynamic({ ssr:false }) from _app so AppKit/ethers never run
// during server rendering.
import { WalletProvider } from '../context/WalletContext.jsx';
import Layout from './Layout.jsx';

export default function Providers({ children }) {
  return (
    <WalletProvider>
      <Layout>{children}</Layout>
    </WalletProvider>
  );
}
