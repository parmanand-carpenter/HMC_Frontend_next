import Head from 'next/head';
import Trade from '../components/Trade.jsx';

export default function BuySellPage() {
  return (
    <>
      <Head>
        <title>Buy / Sell · Half Million Coins</title>
      </Head>
      <Trade />
    </>
  );
}
