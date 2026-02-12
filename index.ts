import {
    MatrixClient,
    SimpleFsStorageProvider,
    AutojoinRoomsMixin,
    LogLevel,
    LogService,
    RichConsoleLogger
} from "matrix-bot-sdk";

// 🔊 Enable detailed logs
LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.DEBUG);
// Optional: quiet noisy modules
LogService.muteModule("Metrics"); // if it’s too chatty

const homeserverUrl = process.env.HOMESERVER_URL ||"https://synapse-production-ea3f.up.railway.app";

// Use the access token you got from login or registration above.
const accessToken = process.env.ACCESS_TOKEN || "mat_Qx00zKPVddst8T5PyowqiKjkNtUXqh_jV6Df3";

const storage = new SimpleFsStorageProvider("hello-bot.json");

// Finally, let's create the client and set it to autojoin rooms. Autojoining is typical of bots to ensure
// they can be easily added to any room.
const client = new MatrixClient(homeserverUrl, accessToken, storage);

AutojoinRoomsMixin.setupOnClient(client);

// Before we start the bot, register our command handler
client.on("room.message", handleCommand);

// Now that everything is set up, start the bot. This will start the sync loop and run until killed.
client.start().then(() => console.log("Bot started!"));

// This is the command handler we registered a few lines up
async function handleCommand(roomId: string, event: any) {
    // Don't handle unhelpful events (ones that aren't text messages, are redacted, or sent by us)
    if (event['content']?.['msgtype'] !== 'm.text') return;
    if (event['sender'] === await client.getUserId()) return;

    // Check to ensure that the `!hello` command is being run
    const body = event['content']['body'];
    if (!body?.startsWith("!hello")) return;

    // Now that we've passed all the checks, we can actually act upon the command
    await client.replyNotice(roomId, event, "Hello world!");
}

async function verifyClient(client: MatrixClient) {
  try {
    const me = await client.getUserId();
    console.log("✅ Token valid for:", me);
  } catch (err: any) {
    const status = err?.statusCode || err?.body?.errcode || "unknown";
    console.error("❌ Token/URL validation failed:", status, err?.message || err);
    throw err;
  }
}


(async () => {
  try {
    await verifyClient(client);

    await client.start();
    console.log("✅ Bot started and syncing");
  } catch (err: any) {
    console.error("❌ Bot failed to start:", err?.message || err);
    process.exit(1);
  }
})();

