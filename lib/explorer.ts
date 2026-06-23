/**
 * Returns the block explorer URL for a given transaction hash on a specific network.
 *
 * @param networkSymbol - The network symbol (e.g. "bep20", "base", "eth")
 * @param txHash - The transaction hash
 */
export function getExplorerTxUrl(
  networkSymbol: string,
  txHash: string
): string | null {
  if (!txHash || txHash === "-") return null

  const symbol = networkSymbol.toLowerCase()

  const explorers: Record<string, string> = {
    bep20: `https://bscscan.com/tx/${txHash}`,
    base: `https://basescan.org/tx/${txHash}`,
    eth: `https://etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
    avalanche: `https://snowtrace.io/tx/${txHash}`,
    solana: `https://solscan.io/tx/${txHash}`,
    trc20: `https://tronscan.org/#/transaction/${txHash}`,
  }

  return explorers[symbol] ?? null
}

/**
 * Returns the human-readable explorer name for a network.
 */
export function getExplorerName(networkSymbol: string): string {
  const symbol = networkSymbol.toLowerCase()

  const names: Record<string, string> = {
    bep20: "BscScan",
    base: "BaseScan",
    eth: "Etherscan",
    polygon: "PolygonScan",
    arbitrum: "Arbiscan",
    optimism: "Optimism Explorer",
    avalanche: "SnowTrace",
    solana: "Solscan",
    trc20: "TronScan",
  }

  return names[symbol] ?? "Explorer"
}
