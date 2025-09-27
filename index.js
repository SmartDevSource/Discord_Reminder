const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN; // On prendra le token depuis Replit
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let participants = []; // IDs des personnes qui ont cliqué "Oui"

// Quand le bot est prêt
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// Commande pour créer un rendez-vous : "!rdv HH:MM"
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!rdv")) return;

  const args = message.content.split(" ");
  if (args.length < 2) {
    return message.reply("⚠️ Utilise : `!rdv HH:MM` (ex: !rdv 15:00)");
  }

  const heure = args[1];
  const [h, m] = heure.split(":").map(Number);

  // Calcul des dates du RDV et du rappel
  const now = new Date();
  const rdvDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const rappel30min = new Date(rdvDate.getTime() - 30 * 60000);

  // Création des boutons
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("oui").setLabel("Oui").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("non").setLabel("Non").setStyle(ButtonStyle.Danger)
  );

  await message.channel.send({
    content: `🗓️ Serez-vous présent au rendez-vous de **${heure}** ?`,
    components: [row],
  });

  // Planifier les rappels
  scheduleReminder(rappel30min, `🔔 Rappel : rendez-vous à ${heure} dans 30 minutes !`);
  scheduleReminder(rdvDate, `🚀 C’est l’heure du rendez-vous à ${heure} !`);
});

// Gestion des clics sur boutons
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "oui") {
    if (!participants.includes(interaction.user.id)) {
      participants.push(interaction.user.id);
    }
    await interaction.reply({ content: "👍 Tu seras notifié !", ephemeral: true });
  }

  if (interaction.customId === "non") {
    participants = participants.filter((id) => id !== interaction.user.id);
    await interaction.reply({ content: "❌ Tu ne recevras pas de rappel.", ephemeral: true });
  }
});

// Fonction pour planifier un rappel
function scheduleReminder(date, message) {
  const delay = date.getTime() - Date.now();
  if (delay > 0) {
    setTimeout(async () => {
      for (const userId of participants) {
        try {
          const user = await client.users.fetch(userId);
          await user.send(message);
        } catch (err) {
          console.error(`❌ Impossible d’envoyer le message à ${userId}`, err);
        }
      }
    }, delay);
  }
}

client.login(TOKEN);
