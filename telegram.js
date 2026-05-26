/**
 * ┆𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟢 — Telegram Bot Interface
 *
 * Users send /pair <phone_number> here to get their WhatsApp pairing code.
 * Each user gets their own independent WhatsApp session.
 */

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { requestPairForUser, getActiveSessions, listSavedSessions, registerCallbacks } = require('./session_manager');

let bot = null;

const FORCE_JOIN_CHANNEL = 'mr_smithvenomdev';
const FORCE_JOIN_GROUP = 'mrsmith_venomdev'
const FORCE_SHARE_LINK = 'mrsmith_venomdev_mdbot';
const chatPhoneMap = new Map();

async function isChannelMember(chatId) {
    try {
        const member = await bot.getChatMember(`@${FORCE_JOIN_CHANNEL}`, chatId);
        return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (err) {
        return false;
    }
}

async function sendJoinRequired(chatId, name) {
    await bot.sendMessage(
        chatId,
        `╔══〘 🚫 *𝐀𝐂𝐂𝐄𝐒𝐒 𝐃𝐄𝐍𝐈𝐄𝐃* 〙══╗\n\n` +
        `Hey *${name}*! You must join our official channel before using 𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟢.\n\n` +
        `👇 Tap the button below, join, then press /start again.\n\n` +
        `╚════════════════════════╝`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 Join 𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹ 𝗧𝗘𝗖𝗛', url: `https://t.me/${FORCE_JOIN_CHANNEL}` }],
                    [{ text: '💎 Join ཐི༏ཋྀ ⃝𝐓𝐇𝐄⃟✠𝐂𝐀𝐓𝐇𝐄𝐃𝐑𝐀𝐋⃤𓉳🌸', url: `https://t.me/${FORCE_JOIN_GROUP}` }],
                      [{ text: '🖇️ SHARE 𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗫𝗠𝗗🔵', url: `https://t.me/${FORCE_SHARE_LINK}` }],
                    [{ text: '🔄 I Joined — Restart', callback_data: 'check_join' }]
                ]
            }
        }
    );
}

function initTelegramBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN || require('./settings').telegramBotToken;

    if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
        console.log('⚠️  TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.');
        return null;
    }

    try {
        bot = new TelegramBot(token, { polling: true });
        console.log('🤖 WELCOME TO 𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟡 Telegram bot started!');

        registerCallbacks({
            onPairCode: (phone, code, errMsg) => {
                const chatId = chatPhoneMap.get(phone);
                if (!chatId) return;

                if (!code) {
                    bot.sendMessage(chatId,
                        `╔══〘 ❌ *𝐄𝐫𝐫𝐨𝐫* 〙══╗\n\n` +
                        `Failed to generate pairing code for *+${phone}*.\n` +
                        (errMsg ? `_Error: ${errMsg}_\n` : '') +
                        `\nTry again by tapping the button below.\n\n` +
                        `╚════════════════════════╝`,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '🔄 Try Again', callback_data: `retry_pair_${phone}` }
                                ]]
                            }
                        }
                    );
                    return;
                }

                bot.sendMessage(chatId,
                    `╔══〘 🔑 *𝗣𝗔𝗜𝗥𝗜𝗡𝗚 𝗖𝗢𝗗𝗘* 〙══╗\n\n` +
                    `✅ *Your WhatsApp Pairing Code:*\n\n` +
                    `\`${code}\`\n\n` +
                    `📱 *Steps to link:*\n` +
                    `1️⃣ Open WhatsApp\n` +
                    `2️⃣ Tap ⋮ Menu → *Linked Devices*\n` +
                    `3️⃣ Tap *Link a Device*\n` +
                    `4️⃣ Tap *Link with phone number instead*\n` +
                    `5️⃣ Enter the code above\n\n` +
                    `⏰ _Code expires in a few minutes — act quickly!_\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '✅ Done — I Entered the Code', callback_data: 'pair_done' }],
                                [{ text: '🔄 Get a New Code', callback_data: `retry_pair_${phone}` }],
                                [{ text: '❓ Need Help?', callback_data: 'pair_help' }]
                            ]
                        }
                    }
                );
            },

            onConnected: (phone) => {
                const chatId = chatPhoneMap.get(phone);
                if (!chatId) return;
                bot.sendMessage(chatId,
                    `╔══〘 🎉 *𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗❕* 〙══╗\n\n` +
                    `✨ *+${phone}* is now linked to 𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟡!\n\n` +
                    `You can now use bot commands directly on WhatsApp.\n` +
                    `Send *.menu* on WhatsApp to see all available commands.\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📋 View WhatsApp Commands', callback_data: 'show_wa_cmds' }],
                                [{ text: '📊 Check Status', callback_data: 'check_status' }]
                            ]
                        }
                    }
                );
            },

            onDisconnected: (phone) => {
                const chatId = chatPhoneMap.get(phone);
                chatPhoneMap.delete(phone);
                if (!chatId) return;
                bot.sendMessage(chatId,
                    `╔══〘 ⚠️ *𝗗𝗶𝘀𝗰𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱* 〙══╗\n\n` +
                    `Your WhatsApp session for *+${phone}* was disconnected.\n\n` +
                    `Tap the button below to reconnect.\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '🔄 Reconnect', callback_data: `retry_pair_${phone}` }
                            ]]
                        }
                    }
                );
            }
        });

        // ─── /start ───────────────────────────────────────────────────────────
        bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from.first_name || 'User';

            const isMember = await isChannelMember(chatId);
            if (!isMember) return sendJoinRequired(chatId, name);

            const welcomeText =
                `╔══〘 ✨ *𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟡* 〙══╗\n\n` +
                `👋 Welcome, *${name}*!\n\n` +
                `is an advanced WhatsApp bot with powerful group management, AI, fun commands, and much more.\n\n` +
                `┏━━━〘 🚀 *𝗚𝗲𝘁 𝗦𝘁𝗮𝗿𝘁𝗲𝗱* 〙━━━\n` +
                `┃ 1️⃣ Tap *Pair My WhatsApp* below\n` +
                `┃ 2️⃣ Enter your number when asked\n` +
                `┃ 3️⃣ Enter the code in WhatsApp\n` +
                `┃ 4️⃣ Send *.menu* on WhatsApp!\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💡 _Use /help to see all Telegram commands_\n\n` +
                `╚════════════════════════╝`;

            const videoPath = path.join(__dirname, 'assets', 'menu.mp4');
            const sendOpts = {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔗 Pair My WhatsApp', callback_data: 'start_pair' }],
                        [
                            { text: '📖 Help', callback_data: 'show_help' }],
                        [
                            { text: '📊 Status', callback_data: 'check_status' }
                        ],
                        [{ text: '📢 Join Our Channel', url: `https://t.me/${FORCE_JOIN_CHANNEL}` }]
                    ]
                }
            };

            if (fs.existsSync(videoPath)) {
                await bot.sendVideo(chatId, fs.createReadStream(videoPath), {
                    caption: welcomeText,
                    ...sendOpts,
                    supports_streaming: true
                }).catch(() => bot.sendMessage(chatId, welcomeText, sendOpts));
            } else {
                await bot.sendMessage(chatId, welcomeText, sendOpts);
            }
        });

        // ─── /pair ────────────────────────────────────────────────────────────
        bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            const name = msg.from.first_name || 'User';

            const isMember = await isChannelMember(chatId);
            if (!isMember) return sendJoinRequired(chatId, name);

            const phoneInput = match && match[1] ? match[1].trim() : null;

            if (!phoneInput) {
                return bot.sendMessage(chatId,
                    `╔══〘 🔗 *𝐂𝐨𝐧𝐧𝐞𝐜𝐭 𝐭𝐨 𝐘𝐨𝐮𝐫 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩* 〙══╗\n\n` +
                    `Please include your phone number.\n\n` +
                    `*Usage:* \`/pair <phone_number>\`\n` +
                    `*Example:* \`/pair 2348012345678\`\n\n` +
                    `📌 _Include country code, no + or spaces_\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '❓ How to Pair', callback_data: 'pair_help' }
                            ]]
                        }
                    }
                );
            }

            const phone = phoneInput.replace(/[^0-9]/g, '');

            if (phone.length < 7 || phone.length > 15) {
                return bot.sendMessage(chatId,
                    `╔══〘 ❌ *𝗶𝗻𝘃𝗮𝗹𝗶𝗱 𝗻𝘂𝗺𝗯𝗲𝗿❕* 〙══╗\n\n` +
                    `That number format is invalid.\n\n` +
                    `*Example:* \`2348012345678\`\n` +
                    `_(Nigeria: +234 801 234 5678)_\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '🔄 Try Again', callback_data: 'start_pair' }
                            ]]
                        }
                    }
                );
            }

            const sessions = getActiveSessions();
            if (sessions.has(phone) && !sessions.get(phone).reconnecting) {
                return bot.sendMessage(chatId,
                    `╔══〘 ✅ *𝐀𝐥𝐫𝐞𝐚𝐝𝐲 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝* 〙══╗\n\n` +
                    `*+${phone}* is already connected and running!\n\n` +
                    `Go to WhatsApp and send *.menu* to use the bot.\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '📊 Check Status', callback_data: 'check_status' }
                            ]]
                        }
                    }
                );
            }

            chatPhoneMap.set(phone, chatId);

            await bot.sendMessage(chatId,
                `╔══〘 ⏳ *𝗣𝗮𝘁𝗶𝗲𝗻𝘁𝗹𝘆 𝗪𝗮𝗶𝘁* 〙══╗\n\n` +
                `⚡ Requesting pairing code for *+${phone}*...\n\n` +
                `_This may take a few seconds._\n\n` +
                `╚════════════════════════╝`,
                { parse_mode: 'Markdown' }
            );

            try {
                const result = await requestPairForUser(phone);
                if (result === 'ALREADY_CONNECTED') {
                    bot.sendMessage(chatId,
                        `╔══〘 ✅ *𝐀𝐥𝐫𝐞𝐚𝐝𝐲 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝* 〙══╗\n\n` +
                        `*+${phone}* is already connected!\n\nSend *.menu* on WhatsApp.\n\n` +
                        `╚════════════════════════╝`,
                        { parse_mode: 'Markdown' }
                    );
                }
            } catch (err) {
                console.error('[Telegram] Pair error:', err.message);
                bot.sendMessage(chatId,
                    `╔══〘 ❌ *𝓔𝓻𝓻𝓸𝓻* 〙══╗\n\n` +
                    `Something went wrong: ${err.message}\n\nPlease try again.\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '🔄 Try Again', callback_data: `retry_pair_${phone}` }
                            ]]
                        }
                    }
                );
            }
        });

        // ─── /sessions ───────────────────────────────────────────────────────
        bot.onText(/\/sessions/, async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from.first_name || 'User';

            const isMember = await isChannelMember(chatId);
            if (!isMember) return sendJoinRequired(chatId, name);

            const saved = listSavedSessions();
            const active = getActiveSessions();

            if (saved.length === 0) {
                return bot.sendMessage(chatId,
                    `╔══〘 📭 *𝗡𝗼 𝗦𝗲𝘀𝘀𝗶𝗼𝗻𝘀* 〙══╗\n\n` +
                    `No sessions yet.\nUse /pair to connect your WhatsApp.\n\n` +
                    `╚════════════════════════╝`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '🔗 Pair WhatsApp', callback_data: 'start_pair' }
                            ]]
                        }
                    }
                );
            }

            const lines = saved.map(phone => {
                const entry = active.get(phone);
                const status = entry && !entry.reconnecting ? '🟢 Connected' : '🔴 Disconnected';
                return `• +${phone} — ${status}`;
            });

            bot.sendMessage(chatId,
                `╔══〘 📋 *𝓢𝓮𝓼𝓼𝓲𝓸𝓷𝓼 (${saved.length})* 〙══╗\n\n` +
                `${lines.join('\n')}\n\n` +
                `╚════════════════════════╝`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔗 Add New Session', callback_data: 'start_pair' }],
                            [{ text: '📊 Status', callback_data: 'check_status' }]
                        ]
                    }
                }
            );
        });

        // ─── /status ─────────────────────────────────────────────────────────
        bot.onText(/\/status/, async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from.first_name || 'User';

            const isMember = await isChannelMember(chatId);
            if (!isMember) return sendJoinRequired(chatId, name);

            const settings = require('./settings');
            const active = getActiveSessions().size;
            const saved = listSavedSessions().length;

            bot.sendMessage(chatId,
                `╔══〘 📊 *┆𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟡* 〙══╗\n\n` +
                `🤖 *Bot:* ${settings.botName}\n` +
                `🔖 *Version:* ${settings.version}\n` +
                `💾 *Saved Sessions:* ${saved}\n` +
                `🔌 *Active Connections:* ${active}\n` +
                `✅ *Status:* Running\n\n` +
                `╚════════════════════════╝`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📋 My Sessions', callback_data: 'show_sessions' }],
                            [{ text: '🔗 Add New Session', callback_data: 'start_pair' }]
                        ]
                    }
                }
            );
        });

        // ─── /broadcast ──────────────────────────────────────────────────────
        // Sends a message to all users who have ever interacted with the bot
        bot.onText(/\/broadcast(?:\s+([\s\S]+))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            const name = msg.from.first_name || 'User';

            // Load owner IDs from settings or env
            const ownerIds = (process.env.TELEGRAM_OWNER_IDS || '')
                .split(',')
                .map(id => parseInt(id.trim(), 10))
                .filter(Boolean);

            if (ownerIds.length > 0 && !ownerIds.includes(chatId)) {
                return bot.sendMessage(chatId,
                    `╔══〘 🚫 *𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗* 〙══╗\n\nOnly the bot owner can use /broadcast.\n\n╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
            }

            const broadcastText = match && match[1] ? match[1].trim() : null;
            if (!broadcastText) {
                return bot.sendMessage(chatId,
                    `╔══〘 📢 *𝐁𝐫𝐨𝐚𝐝𝐜𝐚𝐬𝐭* 〙══╗\n\n` +
                    `Usage: \`/broadcast <message>\`\n\n` +
                    `*Example:*\n\`/broadcast Hello everyone! Bot update is live.\`\n\n` +
                    `This will send your message to all active sessions.\n\n` +
                    `╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
            }

            const saved = listSavedSessions();
            const active = getActiveSessions();

            if (saved.length === 0) {
                return bot.sendMessage(chatId,
                    `╔══〘 📭 *𝐍𝐨 𝐒𝐞𝐬𝐬𝐢𝐨𝐧𝐬* 〙══╗\n\nNo sessions to broadcast to.\n\n╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
            }

            await bot.sendMessage(chatId,
                `╔══〘 ⏳ *𝐁𝐫𝐨𝐚𝐝𝐜𝐚𝐬𝐭𝐢𝐧𝐠...* 〙══╗\n\n` +
                `Sending to ${saved.length} session(s)...\n\n╚════════════════════════╝`,
                { parse_mode: 'Markdown' }
            );

            let sent = 0;
            let failed = 0;
            const broadcastMsg = `╔══〘 📢 *𝐌𝐃 𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄𝐌𝐄𝐍𝐓* 〙══╗\n\n${broadcastText}\n\n╚════════════════════════╝`;

            for (const phone of saved) {
                const entry = active.get(phone);
                if (!entry || !entry.sock) { failed++; continue; }
                try {
                    await entry.sock.sendMessage(`${phone}@s.whatsapp.net`, { text: broadcastMsg });
                    sent++;
                } catch (e) {
                    failed++;
                }
            }

            await bot.sendMessage(chatId,
                `╔══〘 ✅ *𝐁𝐫𝐨𝐚𝐝𝐜𝐚𝐬𝐭 𝐃𝐨𝐧𝐞* 〙══╗\n\n` +
                `✅ *Sent:* ${sent}\n` +
                `❌ *Failed:* ${failed}\n` +
                `📊 *Total:* ${saved.length}\n\n` +
                `╚════════════════════════╝`,
                { parse_mode: 'Markdown' }
            );
        });

        // ─── /help ───────────────────────────────────────────────────────────
        bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from.first_name || 'User';

            const isMember = await isChannelMember(chatId);
            if (!isMember) return sendJoinRequired(chatId, name);

            bot.sendMessage(chatId,
                `╔══〘 📖 * 𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟡 helps the weak * 〙══╗\n\n` +
                `┏━━━〘 🤖 *𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀* 〙━━━\n` +
                `┃ /start — Welcome & instructions\n` +
                `┃ /pair <phone> — Connect WhatsApp\n` +
                `┃ /sessions — List connected accounts\n` +
                `┃ /status — Bot status\n` +
                `┃ /broadcast <msg> — Send to all sessions (owner only)\n` +
                `┃ /help — This message\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `┏━━━〘 📱 *𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀* 〙━━━\n` +
                `┃ .menu — All bot commands\n` +
                `┃ .sticker — Make sticker\n` +
                `┃ .tagall — Tag everyone\n` +
                `┃ .owner — Contact owner\n` +
                `┃ .pair — Pairing info\n` +
                `┃ .ping — Check bot speed\n` +
                `┃ .alive — Bot status\n` +
                `┃ ...and many more!\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `╚════════════════════════╝`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔗 Pair My WhatsApp', callback_data: 'start_pair' }],
                            [
                                { text: '📊 Status', callback_data: 'check_status' },
                                { text: '📋 Sessions', callback_data: 'show_sessions' }
                            ],
                            [{ text: '📢 Join Channel', url: `https://t.me/${FORCE_JOIN_CHANNEL}` }],
                            [{ text: '📢 Join Channel', url: `https://t.me/${FORCE_JOIN_GROUP}`  }]
                        ]
                    }
                }
            );
        });

        // ─── Callback Query Handler (button presses) ─────────────────────────
        bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const name = query.from.first_name || 'User';
            const data = query.data;

            await bot.answerCallbackQuery(query.id).catch(() => {});

            if (data === 'check_join') {
                const isMember = await isChannelMember(chatId);
                if (isMember) {
                    await bot.sendMessage(chatId,
                        `╔══〘 ✅ *𝗩𝗘𝗥𝗜𝗙𝗜𝗘𝗗❕* 〙══╗\n\nWelcome aboard, *${name}*!\nSend /start to begin.\n\n╚════════════════════════╝`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await sendJoinRequired(chatId, name);
                }
                return;
            }

            if (data === 'start_pair') {
                await bot.sendMessage(chatId,
                    `╔══〘 🔗 *𝐂𝐨𝐧𝐧𝐞𝐜𝐭 𝐭𝐨 𝐘𝐨𝐮𝐫 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩* 〙══╗\n\n` +
                    `Send your phone number:\n\n` +
                    `\`/pair 2348012345678\`\n\n` +
                    `📌 _Include country code, no + or spaces_\n\n` +
                    `╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            if (data === 'pair_done') {
                await bot.sendMessage(chatId,
                    `╔══〘 ⏳ *𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗻𝗴...* 〙══╗\n\nYour WhatsApp is being linked. You'll get a confirmation shortly!\n\n╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            if (data === 'pair_help') {
                await bot.sendMessage(chatId,
                    `╔══〘 ❓ *𝗛𝗼𝘄 𝘁𝗼 𝗣𝗮𝗶𝗿* 〙══╗\n\n` +
                    `1️⃣ Send: \`/pair <your_number>\`\n` +
                    `2️⃣ Open *WhatsApp* → ⋮ Menu\n` +
                    `3️⃣ Tap *Linked Devices*\n` +
                    `4️⃣ Tap *Link a Device*\n` +
                    `5️⃣ Tap *Link with phone number*\n` +
                    `6️⃣ Enter the code sent here\n\n` +
                    `╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            if (data === 'check_status') {
                const settings = require('./settings');
                const active = getActiveSessions().size;
                const saved = listSavedSessions().length;
                await bot.sendMessage(chatId,
                    `╔══〘 📊 *𝐌|𝐒𒁂VΣ᳄ФM𒀭 ÐΞV⊹𝗠𝗗🟡 𝚂𝚃𝙰𝚃𝚄𝚂* 〙══╗\n\n` +
                    `🤖 *Bot:* ${settings.botName}\n` +
                    `🔖 *Version:* ${settings.version}\n` +
                    `💾 *Saved Sessions:* ${saved}\n` +
                    `🔌 *Active Connections:* ${active}\n` +
                    `✅ *Status:* Running\n\n` +
                    `╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            if (data === 'show_sessions') {
                const saved = listSavedSessions();
                const active = getActiveSessions();
                if (saved.length === 0) {
                    await bot.sendMessage(chatId, `No sessions yet. Use /pair to connect.`);
                    return;
                }
                const lines = saved.map(phone => {
                    const entry = active.get(phone);
                    const status = entry && !entry.reconnecting ? '🟢 Connected' : '🔴 Disconnected';
                    return `• +${phone} — ${status}`;
                });
                await bot.sendMessage(chatId,
                    `╔══〘 📋 *𝗦𝗲𝘀𝘀𝗶𝗼𝗻𝘀* 〙══╗\n\n${lines.join('\n')}\n\n╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            if (data === 'show_wa_cmds') {
                await bot.sendMessage(chatId,
                    `╔══〘 📱 *𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀* 〙══╗\n\n` +
                    `Send these on WhatsApp:\n\n` +
                    `• .menu — Full command list\n` +
                    `• .help — Help menu\n` +
                    `• .alive — Bot status\n` +
                    `• .owner — Contact owner\n` +
                    `• .sticker — Make sticker\n` +
                    `• .tagall — Tag everyone\n` +
                    `• .ping — Check speed\n` +
                    `• .pair — Pairing info\n\n` +
                    `╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            if (data && data.startsWith('retry_pair_')) {
                const phone = data.replace('retry_pair_', '');
                await bot.sendMessage(chatId,
                    `╔══〘 🔄 *𝗥𝗲𝘁𝗿𝘆𝗶𝗻𝗴* 〙══╗\n\nSend this command to re-pair:\n\n\`/pair ${phone}\`\n\n╚════════════════════════╝`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }
        });

        bot.on('polling_error', (err) => {
            console.error('[Telegram] Polling error:', err.message);
        });

        return bot;
    } catch (err) {
        console.error('[Telegram] Failed to start bot:', err.message);
        return null;
    }
}

function getBot() {
    return bot;
}

module.exports = { initTelegramBot, getBot };
