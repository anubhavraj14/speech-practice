import type { Language } from "@/lib/types";

/**
 * Standalone lines for the warm-up ("easy starts") and breath-group stages.
 *
 * These are deliberately SEPARATE from the reading passage so the earlier stages
 * never repeat the sentences you later read in the long paragraph. They are short,
 * natural, and each comfortably fits one out-breath.
 */

export const easyStarts: Record<Language, string[]> = {
  english: [
    "Good morning.",
    "Let me begin slowly.",
    "One thought at a time.",
    "There is no hurry.",
    "I can take my time.",
    "Easy and unforced.",
    "I am ready to begin.",
    "Let the words come gently.",
  ],
  hindi: [
    "शुभ प्रभात।",
    "मैं धीरे से शुरू करता हूँ।",
    "एक समय में एक विचार।",
    "कोई जल्दी नहीं है।",
    "मैं अपना समय ले सकता हूँ।",
    "आराम से, बिना ज़ोर के।",
    "मैं शुरू करने के लिए तैयार हूँ।",
    "शब्दों को सहज आने दें।",
  ],
  hinglish: [
    "Good morning.",
    "Main dheere se shuru karta hoon.",
    "Ek time par ek thought.",
    "Koi jaldi nahi hai.",
    "Main apna time le sakta hoon.",
    "Aaram se, bina force ke.",
    "Main shuru karne ke liye ready hoon.",
    "Words ko gently aane do.",
  ],
};

export const breathLines: Record<Language, string[]> = {
  english: [
    "The train arrives at nine, so we should leave soon.",
    "I made a cup of tea and sat by the window.",
    "Could you please pass me the salt?",
    "We walked to the market, and then we came home.",
    "Thank you for waiting; I really appreciate it.",
    "The weather is lovely today, isn't it?",
    "Let me know when you are free to talk.",
    "I finished the report, and I sent it this morning.",
    "She smiled, waved, and walked into the room.",
    "Please take a seat; the doctor will see you soon.",
    "We had dinner together and talked for a long time.",
    "I will call you back in a few minutes.",
  ],
  hindi: [
    "ट्रेन नौ बजे आती है, इसलिए हमें जल्दी निकलना चाहिए।",
    "मैंने एक कप चाय बनाई और खिड़की के पास बैठ गया।",
    "क्या आप मुझे नमक दे सकते हैं?",
    "हम बाज़ार तक गए, और फिर घर लौट आए।",
    "इंतज़ार करने के लिए धन्यवाद, मैं सचमुच आभारी हूँ।",
    "आज मौसम बहुत सुहावना है, है ना?",
    "जब आप बात करने के लिए खाली हों, मुझे बता दें।",
    "मैंने रिपोर्ट पूरी की, और सुबह भेज दी।",
    "वह मुस्कुराई, हाथ हिलाया, और कमरे में चली गई।",
    "कृपया बैठिए, डॉक्टर आपको जल्दी ही देखेंगे।",
    "हमने साथ खाना खाया और देर तक बातें कीं।",
    "मैं कुछ ही मिनटों में आपको वापस कॉल करूँगा।",
  ],
  hinglish: [
    "Train nau baje aati hai, isliye humein jaldi nikalna chahiye.",
    "Maine ek cup chai banayi aur window ke paas baith gaya.",
    "Kya aap mujhe salt de sakte hain?",
    "Hum market tak gaye, aur phir ghar aa gaye.",
    "Wait karne ke liye thank you, main really appreciate karta hoon.",
    "Aaj weather bahut lovely hai, hai na?",
    "Jab aap free ho baat karne ke liye, mujhe bata dena.",
    "Maine report complete ki, aur subah send kar di.",
    "Woh smile ki, haath hilaya, aur room mein chali gayi.",
    "Please baith jaiye, doctor aapko jaldi dekhenge.",
    "Humne saath dinner kiya aur der tak baatein keen.",
    "Main kuch hi minutes mein aapko call back karunga.",
  ],
};
