import {
    MatrixClient,
    SimpleFsStorageProvider,
    AutojoinRoomsMixin,
    LogLevel,
    LogService,
    RichConsoleLogger
} from "matrix-bot-sdk";
import * as dotenv from "dotenv";

dotenv.config();

LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.DEBUG);
LogService.muteModule("Metrics");

// Configuration from Environment Variables
const homeserverUrl = process.env.HOMESERVER_URL || "https://synapse-production-ea3f.up.railway.app";
const accessToken = process.env.ACCESS_TOKEN;

if (!accessToken) {
    console.error("❌ ERROR: ACCESS_TOKEN is not defined in environment variables.");
    process.exit(1);
}

const storage = new SimpleFsStorageProvider("hello-bot.json");
const client = new MatrixClient(homeserverUrl, accessToken, storage);

AutojoinRoomsMixin.setupOnClient(client);

async function handleCommand(roomId: string, event: any) {
    if (event['content']?.['msgtype'] !== 'm.text') return;

    // Safety: ensure we don't reply to ourselves
    const myUserId = await client.getUserId();
    if (event['sender'] === myUserId) return;

    const body = event['content']['body'];
    if (!body?.startsWith("!hello")) return;

    console.log(`💬 Responding to !hello in ${roomId}`);
    await client.replyNotice(roomId, event, "Hello world!");
}

client.on("room.message", handleCommand);

(async () => {
    try {
        // Verify connection before starting sync
        const me = await client.getUserId();
        console.log("✅ Authenticated as:", me);

        await client.start();
        console.log("🚀 Bot started and syncing...");
    } catch (err: any) {
        console.error("❌ Bot failed to start:", err?.body?.error || err.message);
        process.exit(1);
    }
})();