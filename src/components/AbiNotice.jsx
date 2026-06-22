
export default function AbiNotice() {
  return (
    <div className="card abi-notice">
      <h3>⚙️ Almost ready — paste the contract ABIs</h3>
      <p>
        The buy/sell module is wired up, but the contract ABIs are still empty. Paste each
        contract&apos;s ABI (a JSON array) into these files, then refresh:
      </p>
      <ul className="mono">
        <li>src/config/abis/HMC.json</li>
        <li>src/config/abis/TestUSDT.json</li>
        <li>src/config/abis/TestUSDC.json</li>
      </ul>
      <p className="muted">
        Tip: in Remix, open the contract&apos;s “Compilation Details” (or the artifact) and copy the
        ABI array. On Etherscan, use the verified contract&apos;s “Contract ABI” section.
      </p>
    </div>
  );
}
