import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import readline from "readline";
import { Writable } from "stream";

// Custom writable stream that can mute output to hide passwords securely
class MutableWritable extends Writable {
  public muted = false;
  _write(chunk: any, encoding: string, callback: any) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding as any);
    }
    callback();
  }
}

const mutableStdout = new MutableWritable();
const rl = readline.createInterface({
  input: process.stdin,
  output: mutableStdout,
  terminal: true,
});

const ask = (questionText: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(questionText, (answer) => {
      resolve(answer);
    });
  });
};

// Helper to ask password securely (hiding input like sudo)
const askPassword = (questionText: string): Promise<string> => {
  mutableStdout.muted = false;
  process.stdout.write(questionText);
  mutableStdout.muted = true;

  return new Promise((resolve) => {
    rl.question("", (answer) => {
      mutableStdout.muted = false;
      process.stdout.write("\n");
      resolve(answer);
    });
  });
};

async function main() {
  console.log("=========================================");
  console.log("          DB USER PASSWORD MANAGER        ");
  console.log("=========================================\n");

  try {
    // 1. List users
    console.log("Connecting to database and fetching users...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("❌ No users found in the database.");
      rl.close();
      return;
    }

    console.log("\nExisting Users:");
    console.log("--------------------------------------------------------------------------------");
    console.log(`${"Idx".padEnd(5)} | ${"Name".padEnd(20)} | ${"Email".padEnd(35)} | ${"Role"}`);
    console.log("--------------------------------------------------------------------------------");
    users.forEach((user, index) => {
      const name = user.name || "N/A";
      console.log(`${String(index + 1).padEnd(5)} | ${name.padEnd(20)} | ${user.email.padEnd(35)} | ${user.role}`);
    });
    console.log("--------------------------------------------------------------------------------\n");

    // 2. Select user
    let selectedUser = null;
    while (!selectedUser) {
      const input = await ask("Select user by Index or enter Email: ");
      const trimmed = input.trim();

      if (!trimmed) {
        console.log("❌ Input cannot be empty.");
        continue;
      }

      // Check if input is a valid index
      const index = parseInt(trimmed, 10);
      if (!isNaN(index) && index >= 1 && index <= users.length) {
        selectedUser = users[index - 1];
      } else {
        // Try finding by email (case-insensitive)
        const userByEmail = users.find((u) => u.email.toLowerCase() === trimmed.toLowerCase());
        if (userByEmail) {
          selectedUser = userByEmail;
        } else {
          console.log(`❌ User matching "${trimmed}" not found. Please try again.`);
        }
      }
    }

    console.log(`\nSelected User: ${selectedUser.name || "N/A"} (${selectedUser.email})`);

    // 3. Get new password
    let password = "";
    let confirmPassword = "";
    while (true) {
      password = await askPassword("Enter new password (input will be hidden): ");
      if (password.length < 6) {
        console.log("❌ Password must be at least 6 characters long.");
        continue;
      }

      confirmPassword = await askPassword("Confirm new password (input will be hidden): ");
      if (password !== confirmPassword) {
        console.log("❌ Passwords do not match. Please try again.");
        continue;
      }
      break;
    }

    // 4. Hash and save
    console.log("\nHashing password and updating database...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { email: selectedUser.email },
      data: { password: hashedPassword },
    });

    console.log("✅ Password successfully updated and hashed in the database!");

    // 5. Verify login
    const testLogin = await ask("\nWould you like to test logging in with the new password? (y/n): ");
    if (testLogin.trim().toLowerCase() === "y") {
      const loginPassword = await askPassword("Enter password to verify login (input will be hidden): ");

      // Fetch the updated user state to verify the database hash matches
      const dbUser = await prisma.user.findUnique({
        where: { email: selectedUser.email },
      });

      if (!dbUser) {
        console.log("❌ Error: User was not found in the database during verification!");
      } else {
        const isMatch = await bcrypt.compare(loginPassword, dbUser.password);
        if (isMatch) {
          console.log("✅ Login verification SUCCESSFUL! The password is correct and hashes match.");
        } else {
          console.log("❌ Login verification FAILED! Incorrect password.");
        }
      }
    }

  } catch (error) {
    console.error("❌ An error occurred:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
