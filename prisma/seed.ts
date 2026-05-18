import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const networks = [
    {
      name: "Solana",
      symbol: "solana",
      is_active: false,
      network_type: "mainnet" as const,
      usdt_contract_address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      gas_fee_token_name: "SOL",
      rpc_url: "https://api.mainnet-beta.solana.com",
      usdt_decimals: 6,
    },
    {
      name: "Avalanche",
      symbol: "avalanche",
      is_active: false,
      network_type: "mainnet" as const,
      usdt_contract_address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
      gas_fee_token_name: "AVAX",
      rpc_url: "https://api.avax.network/ext/bc/C/rpc",
      usdt_decimals: 6,
    },
    {
      name: "Optimism",
      symbol: "optimism",
      is_active: false,
      network_type: "mainnet" as const,
      usdt_contract_address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      gas_fee_token_name: "ETH",
      rpc_url: "https://mainnet.optimism.io",
      usdt_decimals: 6,
    },
    {
      name: "Arbitrum One",
      symbol: "arbitrum",
      is_active: false,
      network_type: "mainnet" as const,
      usdt_contract_address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      gas_fee_token_name: "ETH",
      rpc_url: "https://arb1.arbitrum.io/rpc",
      usdt_decimals: 6,
    },
    {
      name: "Tron",
      symbol: "trc20",
      is_active: false,
      network_type: "mainnet" as const,
      usdt_contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      gas_fee_token_name: "TRX",
      rpc_url: "https://api.trongrid.io",
      usdt_decimals: 6,
    },
    {
      name: "Polygon",
      symbol: "polygon",
      is_active: false,
      network_type: "mainnet" as const,
      usdt_contract_address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      gas_fee_token_name: "POL",
      rpc_url: "https://polygon-rpc.com",
      usdt_decimals: 6,
    },
    {
      name: "Binance Smart Chain",
      symbol: "bep20",
      is_active: true,
      network_type: "mainnet" as const,
      usdt_contract_address: "0x55d398326f99059fF775485246999027B3197955",
      gas_fee_token_name: "BNB",
      rpc_url: "https://bsc-dataseed.binance.org",
      usdt_decimals: 18,
    },
    {
      name: "Base",
      symbol: "base",
      is_active: true,
      network_type: "mainnet" as const,
      usdt_contract_address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
      gas_fee_token_name: "ETH",
      rpc_url: "https://mainnet.base.org",
      usdt_decimals: 6,
    },
    {
      name: "Ethereum",
      symbol: "eth",
      is_active: false,
      network_type: "mainnet" as const,
      usdt_contract_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      gas_fee_token_name: "ETH",
      rpc_url: "https://eth.llamarpc.com",
      usdt_decimals: 6,
    },
  ]

  console.log("🌱 Seeding networks...")

  for (const network of networks) {
    const existing = await prisma.networks.findFirst({
      where: { symbol: network.symbol },
    })

    if (existing) {
      console.log(`  ⏭️  Skipping "${network.name}" (symbol: ${network.symbol}) — already exists`)
      continue
    }

    await prisma.networks.create({
      data: network,
    })

    console.log(`  ✅ Created "${network.name}" (symbol: ${network.symbol})`)
  }

  console.log("🌱 Seeding admin user...")
  const adminEmail = "admin@spinzopay.com"
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingUser) {
    console.log(`  ⏭️  Skipping user "${adminEmail}" — already exists`)
  } else {
    // We import bcrypt dynamically to avoid issues if it's not needed by other scripts
    const bcrypt = await import("bcrypt")
    const hashedPassword = await bcrypt.hash("password123", 10)
    
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      }
    })
    console.log(`  ✅ Created user "${adminEmail}" (password: password123)`)
  }

  console.log("🌱 Seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
