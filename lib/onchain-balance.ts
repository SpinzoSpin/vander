interface FetchBalanceParams {
  rpcUrl: string;
  walletAddress: string;
  usdtContractAddress: string;
  usdtDecimals: number;
  networkSymbol: string;
  networkCategory: string;
  networkName: string;
}

export async function fetchOnchainBalance({
  rpcUrl,
  walletAddress,
  usdtContractAddress,
  usdtDecimals,
  networkSymbol,
  networkCategory,
  networkName,
}: FetchBalanceParams): Promise<number | null> {
  const symbol = networkSymbol.toLowerCase();
  const name = networkName.toLowerCase();
  const category = networkCategory.toLowerCase();

  // Create an AbortController for a 4-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    // 1. Solana (SVM)
    if (symbol === "solana" || name.includes("solana") || category === "svm") {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenAccountsByOwner",
          params: [
            walletAddress,
            { mint: usdtContractAddress },
            { encoding: "jsonParsed" }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Solana RPC response not OK: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.error) {
        throw new Error(`Solana RPC error: ${json.error.message || JSON.stringify(json.error)}`);
      }

      const value = json.result?.value || [];
      if (value.length === 0) {
        return 0;
      }

      const uiAmount = value[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return typeof uiAmount === "number" ? uiAmount : 0;
    }

    // 2. Tron
    if (symbol === "trc20" || name.includes("tron")) {
      let tronRpcUrl = rpcUrl;
      if (tronRpcUrl.endsWith("/wallet")) {
        tronRpcUrl = tronRpcUrl.slice(0, -7);
      } else if (tronRpcUrl.endsWith("/")) {
        tronRpcUrl = tronRpcUrl.slice(0, -1);
      }

      const url = `${tronRpcUrl}/v1/accounts/${walletAddress}`;
      const response = await fetch(url, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TronGrid response not OK: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.data && json.data.length > 0) {
        const trc20Balances = json.data[0].trc20 || [];
        const match = trc20Balances.find((item: any) =>
          Object.keys(item).some(key => key.toLowerCase() === usdtContractAddress.toLowerCase())
        );
        if (match) {
          const rawVal = Object.values(match)[0] as string;
          const decimals = Number(usdtDecimals) || 6;
          return Number(rawVal) / Math.pow(10, decimals);
        }
        return 0;
      }
      return 0;
    }

    // 3. EVM (Default)
    const cleanAddress = walletAddress.startsWith("0x") ? walletAddress.slice(2) : walletAddress;
    const paddedAddress = cleanAddress.padStart(64, "0");
    const data = `0x70a08231${paddedAddress}`;

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: usdtContractAddress,
            data: data
          },
          "latest"
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`EVM RPC response not OK: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.error) {
      throw new Error(`EVM RPC error: ${json.error.message || JSON.stringify(json.error)}`);
    }

    const hexResult = json.result;
    if (!hexResult || hexResult === "0x") {
      return 0;
    }

    const rawValue = BigInt(hexResult);
    const decimals = Number(usdtDecimals) || 6;
    const divisor = BigInt(10) ** BigInt(decimals);
    const integerPart = rawValue / divisor;
    const fractionalPart = rawValue % divisor;
    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const balanceStr = `${integerPart}.${fractionalStr}`;
    return Number(balanceStr);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Failed to fetch balance for ${walletAddress} on ${networkName}:`, error);
    return null;
  }
}
