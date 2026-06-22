// Home page — landing. Header/footer come from the shared Layout.
import Head from 'next/head';
import Hero from '../components/Hero.jsx';
import ProjectDescription from '../components/ProjectDescription.jsx';
import HomeSections from '../components/HomeSections.jsx';

export default function Home() {
  return (
    <>
      <Head>
        <title>Half Million Coins (HMC)</title>
      </Head>
      <Hero />
      <ProjectDescription />
      <HomeSections />
    </>
  );
}
