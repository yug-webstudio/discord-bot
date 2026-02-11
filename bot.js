const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

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

let storedPosts = {
  news: [],
  updates: [],
  events: []
};

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const type in CHANNELS) {
    const channel = await client.channels.fetch(CHANNELS[type]);

    const messages = await channel.messages.fetch({ limit: 5 });

    storedPosts[type] = messages
      .filter(msg => !msg.author.bot)
      .map(msg => ({
        title: msg.content.split('\n')[0],
        content: msg.content,
        date: msg.createdAt
      }))
      .reverse();
  }

  console.log("Messages loaded.");
});

// API endpoint for your website
app.get('/api/posts', (req, res) => {
  res.json(storedPosts);
});

app.listen(PORT, () => {
  console.log("API running on port " + PORT);
});

client.login(process.env.BOT_TOKEN);
