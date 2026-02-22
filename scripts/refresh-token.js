#!/usr/bin/env node

/**
 * Matrix Bot Token Refresh Script
 *
 * This script:
 * 1. Connects to Synapse with username/password
 * 2. Gets a new access token
 * 3. Updates .env file with new token
 *
 * Designed to run daily via GitHub Actions
 */

const { MatrixClient } = require("matrix-bot-sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const HOMESERVER_URL = process.env.HOMESERVER_URL;
const BOT_USERNAME = process.env.BOT_USERNAME;
const BOT_PASSWORD = process.env.BOT_PASSWORD;
const ENV_FILE = path.join(__dirname, "..", ".env");

console.log("🔐 Matrix Bot Token Refresh Script");
console.log("==================================\n");

// Validate environment
if (!HOMESERVER_URL || !BOT_USERNAME || !BOT_PASSWORD) {
    console.error("❌ Missing required environment variables:");
    console.error("   HOMESERVER_URL:", HOMESERVER_URL ? "✓" : "✗");
    console.error("   BOT_USERNAME:", BOT_USERNAME ? "✓" : "✗");
    console.error("   BOT_PASSWORD:", BOT_PASSWORD ? "✓" : "✗");
    console.error("\nAdd these as GitHub Secrets in your repository.");
    process.exit(1);
}

console.log("📋 Configuration:");
console.log(`   Homeserver: ${HOMESERVER_URL}`);
console.log(`   Username: ${BOT_USERNAME}`);
console.log(`   .env location: ${ENV_FILE}\n`);

/**
 * Login and get new token
 */
async function refreshToken() {
    try {
        // Create a temporary client (without token yet)
        console.log("🔑 Attempting login...");
        const tempClient = new MatrixClient(HOMESERVER_URL);

        // Login with username and password
        const loginResponse = await tempClient.login("m.login.user", {
            user: BOT_USERNAME,
            password: BOT_PASSWORD,
        });

        const newToken = loginResponse.access_token;
        const userId = loginResponse.user_id;

        if (!newToken) {
            throw new Error("No access token received from server");
        }

        console.log("✅ Login successful!");
        console.log(`   User ID: ${userId}`);
        console.log(`   New token: ${newToken.substring(0, 10)}...${newToken.substring(newToken.length - 10)}\n`);

        // Read current .env
        if (!fs.existsSync(ENV_FILE)) {
            throw new Error(`.env file not found at ${ENV_FILE}`);
        }

        let envContent = fs.readFileSync(ENV_FILE, "utf8");

        // Check if file has ACCESS_TOKEN line
        if (!envContent.includes("ACCESS_TOKEN=")) {
            console.log("⚠️  No ACCESS_TOKEN found in .env, adding it...");
            envContent += `\nACCESS_TOKEN=${newToken}\n`;
        } else {
            // Replace old token with new one
            envContent = envContent.replace(
                /ACCESS_TOKEN=.*/,
                `ACCESS_TOKEN=${newToken}`
            );
        }

        // Write updated .env
        fs.writeFileSync(ENV_FILE, envContent);
        console.log("✅ .env file updated with new token");

        // Show what changed
        console.log("\n📝 Changes made to .env:");
        console.log(`   ACCESS_TOKEN=mat_${newToken.substring(4, 14)}...`);
        console.log("\n✨ Token refresh completed successfully!\n");

        return true;

    } catch (error) {
        console.error("\n❌ Token refresh failed!");
        console.error(`Error: ${error.message}\n`);

        if (error.message.includes("Invalid password")) {
            console.error("💡 Hint: Check that BOT_PASSWORD is correct");
            console.error("   The password must match your Synapse user account");
        } else if (error.message.includes("Unknown user")) {
            console.error("💡 Hint: Check that BOT_USERNAME is correct");
            console.error("   Make sure the user exists on Synapse");
        } else if (error.message.includes("ECONNREFUSED")) {
            console.error("💡 Hint: Can't connect to Synapse");
            console.error("   Check that HOMESERVER_URL is reachable");
        }

        console.error("\nGitHub Secrets to verify:");
        console.error("   - HOMESERVER_URL");
        console.error("   - BOT_USERNAME");
        console.error("   - BOT_PASSWORD\n");

        process.exit(1);
    }
}

// Run the refresh
refreshToken().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
