const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // THIS FIXES YOUR ERROR

const PORT = process.env.PORT || 3000;


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Channel IDs
const CHANNELS = {
  news: "1392002771649298447",
  updates: "1392002771649298448",
  events: "1403669616890347593"
};

let storedPosts = {
  news: [],
  updates: [],
  events: []
};

// Utility: clean message formatting
function cleanText(text) {
  return text
    .replace(/@everyone/g, "")
    .replace(/@here/g, "")
    .replace(/<a?:\w+:\d+>/g, "") // remove custom emojis
    .replace(/[#*_`]/g, "") // remove markdown symbols
    .trim();
}

// Load last 5 messages on startup
async function loadInitialMessages() {
  for (const type in CHANNELS) {
    const channel = await client.channels.fetch(CHANNELS[type]);
    const messages = await channel.messages.fetch({ limit: 5 });

    storedPosts[type] = messages
      .filter(msg => !msg.author.bot)
      .map(msg => ({
        title: cleanText(msg.content.split('\n')[0]) || "No title",
        date: msg.createdAt
      }))
      .reverse();
  }

  console.log("Initial messages loaded.");
}

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await loadInitialMessages();
});

// 🔥 LIVE UPDATE LISTENER
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  for (const type in CHANNELS) {
    if (message.channel.id === CHANNELS[type]) {

      const newPost = {
        title: cleanText(message.content.split('\n')[0]) || "No title",
        date: message.createdAt
      };

      storedPosts[type].unshift(newPost);

      // Keep only last 5
      if (storedPosts[type].length > 5) {
        storedPosts[type].pop();
      }

      console.log(`New ${type} post stored.`);
    }
  }
});

// Health route (required by Render)
app.get("/", (req, res) => {
  res.send("Discord Live API Running");
});

// API for FluxCP
app.get("/api/posts", (req, res) => {
  res.json(storedPosts);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.BOT_TOKEN);

