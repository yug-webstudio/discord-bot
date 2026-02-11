const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Your Channel IDs
const CHANNELS = {
  news: "1392002771649298447",      // Announcements
  updates: "1392002771649298448",   // Change-logs
  events: "1403669616890347593"     // Events
};

// Storage
let storedPosts = {
  news: [],
  updates: [],
  events: []
};

// When bot is ready
client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    for (const type in CHANNELS) {
      const channel = await client.channels.fetch(CHANNELS[type]);

      if (!channel) continue;

      const messages = await channel.messages.fetch({ limit: 5 });

      storedPosts[type] = messages
        .filter(msg => !msg.author.bot)
        .map(msg => ({
          title: msg.content.split('\n')[0] || "No title",
          content: msg.content,
          date: msg.createdAt
        }))
        .reverse();
    }

    console.log("Messages loaded successfully.");
  } catch (err) {
    console.error("Error loading messages:", err);
  }
});

// Root route (required for Render port detection)
app.get("/", (req, res) => {
  res.send("Discord Bot API is running.");
});

// API endpoint for FluxCP
app.get("/api/posts", (req, res) => {
  res.json(storedPosts);
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Login bot
client.login(process.env.BOT_TOKEN);
