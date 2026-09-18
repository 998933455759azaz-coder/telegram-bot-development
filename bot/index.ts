import { Telegraf, Markup } from "telegraf"
import type { Context } from "telegraf"

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error("TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi topilmadi")

const bot = new Telegraf(token)
const admins = new Set(
  (process.env.TELEGRAM_ADMIN_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
)
const balances = new Map<number, number>()
const referrals = new Map<number, number>()
const bannedUsers = new Set<number>()

function isBanned(ctx: Context) {
  return Boolean(ctx.from && bannedUsers.has(ctx.from.id))
}

function balanceOf(ctx: Context) {
  return balances.get(ctx.from?.id ?? 0) ?? 0
}

const mainKeyboard = () => Markup.keyboard([
  ["💼 Profile", "⭐ Stars sotib olish"],
  ["🎁 Gift sotib olish", "🏆 Premium sotib olish"],
  ["💰 Hisob to'ldirish", "💳 Hisobim"],
  ["🔗 Referral", "🆘 Support"],
  ["🛠 Admin panel"],
  ["❌ Bekor qilish"],
]).resize()

const adminKeyboard = () => Markup.keyboard([
  ["📊 Statistika", "📥 Pending tranzaksiyalar"],
  ["➕ Admin qo'shish", "➖ Admin olish"],
  ["📣 Post yuborish", "✉️ Xabar yuborish foydalanuvchiga"],
  ["🚫 Ban user", "♻️ Unban user"],
  ["🎁 Manage gifts", "📜 Tarix"],
  ["🔙 Orqaga"],
]).resize()

function isAdmin(ctx: Context) {
  return Boolean(ctx.from && admins.has(String(ctx.from.id)))
}

function userName(ctx: Context) {
  return ctx.from?.first_name ?? "foydalanuvchi"
}

bot.use(async (ctx, next) => {
  if (isBanned(ctx)) {
    await ctx.reply("Sizning akkauntingiz bloklangan.")
    return
  }
  await next()
})

bot.start(async (ctx) => {
  if (ctx.from) {
    referrals.set(ctx.from.id, referrals.get(ctx.from.id) ?? 0)
  }
  await ctx.reply(
    `Assalomu alaykum, ${userName(ctx)}!\n\nStars botga xush kelibsiz. Kerakli bo'limni tanlang:`,
    mainKeyboard(),
  )
})

bot.hears("💼 Profile", async (ctx) => {
  const username = ctx.from?.username ? `@${ctx.from.username}` : "username ko'rsatilmagan"
  await ctx.reply(
    `💼 Profil\n\nIsm: ${userName(ctx)}\nUsername: ${username}\nID: ${ctx.from?.id}\nBalans: ${balanceOf(ctx).toLocaleString("uz-UZ")} so'm\nTakliflar: ${referrals.get(ctx.from?.id ?? 0) ?? 0}`,
    mainKeyboard(),
  )
})

bot.hears("⭐ Stars sotib olish", (ctx) => ctx.reply("⭐ Stars sotib olish\n\nPaketni tanlang:", Markup.inlineKeyboard([
  [Markup.button.callback("⭐ 50 Stars", "buy_stars_50"), Markup.button.callback("⭐ 100 Stars", "buy_stars_100")],
  [Markup.button.callback("⭐ 500 Stars", "buy_stars_500")],
])))

bot.hears("🎁 Gift sotib olish", (ctx) => ctx.reply("🎁 Gift sotib olish\n\nMavjud giftlar tez orada shu yerda ko'rsatiladi."))
bot.hears("🏆 Premium sotib olish", (ctx) => ctx.reply("🏆 Premium sotib olish\n\nMuddatni tanlang:", Markup.inlineKeyboard([
  [Markup.button.callback("1 oy", "premium_1"), Markup.button.callback("3 oy", "premium_3")],
  [Markup.button.callback("12 oy", "premium_12")],
])))
bot.hears("💰 Hisob to'ldirish", (ctx) => ctx.reply("💰 Hisob to'ldirish\n\nTo'lov usulini tanlang:", Markup.inlineKeyboard([
  [Markup.button.callback("💳 Karta orqali", "deposit_card")],
  [Markup.button.callback("🔙 Orqaga", "back_main")],
])))
bot.hears("💳 Hisobim", (ctx) => ctx.reply(`💳 Hisobingiz: ${balanceOf(ctx).toLocaleString("uz-UZ")} so'm\n\nBalans to'ldirilgach, shu yerda ko'rsatiladi.`, mainKeyboard()))
bot.hears("🔗 Referral", (ctx) => ctx.reply(`🔗 Sizning referral kodingiz: REF${ctx.from?.id}\n\nReferral havola:\nhttps://t.me/${ctx.botInfo.username}?start=REF${ctx.from?.id}\n\nTaklif qilinganlar: ${referrals.get(ctx.from?.id ?? 0) ?? 0}\nHar bir yangi ro'yxatdan o'tgan do'stingiz uchun bonus oling.`, mainKeyboard()))
bot.hears("🆘 Support", (ctx) => ctx.reply("🆘 Support\n\nSavollaringiz bo'lsa, @support_username ga yozing."))
bot.hears("❌ Bekor qilish", (ctx) => ctx.reply("Amal bekor qilindi.", mainKeyboard()))
bot.hears("🛠 Admin panel", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("Sizda admin huquqi mavjud emas.", mainKeyboard())
  await ctx.reply("Admin panel:", adminKeyboard())
})

bot.hears("🔙 Orqaga", (ctx) => ctx.reply("Asosiy menyu:", mainKeyboard()))
bot.hears("📊 Statistika", (ctx) => ctx.reply("📊 Statistika\n\nFoydalanuvchilar: 0\nTo'lovlar: 0\nFaol foydalanuvchilar: 0", adminKeyboard()))
bot.hears("📥 Pending tranzaksiyalar", (ctx) => ctx.reply("📥 Pending tranzaksiyalar\n\nKutilayotgan tranzaksiyalar mavjud emas.", adminKeyboard()))
for (const label of ["➕ Admin qo'shish", "➖ Admin olish", "📣 Post yuborish", "✉️ Xabar yuborish foydalanuvchiga", "🚫 Ban user", "♻️ Unban user", "🎁 Manage gifts", "📜 Tarix"]) {
  bot.hears(label, (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply("Sizda admin huquqi mavjud emas.", mainKeyboard())
    return ctx.reply(`${label}\n\nBu bo'lim keyingi bosqichda to'liq sozlanadi.`, adminKeyboard())
  })
}

bot.on("callback_query", async (ctx) => {
  await ctx.answerCbQuery()
  const callback = "data" in ctx.callbackQuery ? ctx.callbackQuery.data : ""
  if (callback === "back_main") return ctx.reply("Asosiy menyu:", mainKeyboard())
  if (callback.startsWith("buy_stars_")) return ctx.reply("Buyurtma qabul qilindi. To'lov ma'lumotlari tez orada yuboriladi.", mainKeyboard())
  if (callback.startsWith("premium_")) return ctx.reply("Premium buyurtmangiz qabul qilindi.", mainKeyboard())
  if (callback === "deposit_card") return ctx.reply("Karta raqami va to'lov chekini yuboring. Admin tasdiqlaganidan keyin balansingiz to'ldiriladi.", mainKeyboard())
})

bot.catch((error) => console.error("[v0] Telegram bot xatosi:", error))
bot.launch().then(() => console.log("[v0] Stars bot ishga tushdi"))

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
