import type { Language } from "@/lib/types";

/**
 * Real-world conversation scenarios. Each has a short situation, a model answer
 * (plain sentences — the breath pacer chunks them into breath groups at render
 * time), and a "your turn" prompt so the user practises the same exchange with
 * their own words while keeping the breathing rhythm.
 */
export interface Scenario {
  id: string;
  /** Short category label, e.g. "Everyday". */
  context: string;
  /** Scenario title. */
  title: string;
  /** The situation / the other person's line. */
  prompt: string;
  /** A natural model answer, one sentence per entry. */
  model: string[];
  /** Invitation to respond in the user's own words. */
  yourTurn: string;
}

export const scenarios: Record<Language, Scenario[]> = {
  english: [
    {
      id: "en-sc-coffee", context: "Everyday", title: "Ordering at a café",
      prompt: "The barista says: “Hi, what can I get for you?”",
      model: [
        "Hi, good morning.",
        "Could I get a medium latte, please, with oat milk?",
        "And one small butter croissant.",
        "That's everything, thank you.",
      ],
      yourTurn: "Now order your own drink and a snack, pausing for a breath between each line.",
    },
    {
      id: "en-sc-intro", context: "Work", title: "Introducing yourself",
      prompt: "At a new team meeting, someone asks: “Can you tell us a bit about yourself?”",
      model: [
        "Sure, happy to.",
        "My name is Arjun, and I've just joined the design team.",
        "Before this, I spent three years working on mobile apps.",
        "I'm really looking forward to getting to know everyone.",
      ],
      yourTurn: "Introduce yourself in four short lines. Take a calm breath before each one.",
    },
    {
      id: "en-sc-reschedule", context: "Phone call", title: "Rescheduling an appointment",
      prompt: "You call the clinic: the receptionist answers, “How can I help?”",
      model: [
        "Hello, I'd like to reschedule my appointment.",
        "It's currently booked for Thursday afternoon.",
        "Would it be possible to move it to next Monday instead?",
        "Morning would work best for me, if there's a slot.",
      ],
      yourTurn: "Make your own call to change a booking. One idea per breath.",
    },
    {
      id: "en-sc-update", context: "Work", title: "A quick status update",
      prompt: "In a stand-up, your manager asks: “Where are things at?”",
      model: [
        "We finished the first phase yesterday.",
        "Right now, I'm reviewing the feedback from testing.",
        "I should have the summary ready by tomorrow.",
        "After that, we can plan the next steps together.",
      ],
      yourTurn: "Give a short update on something you're working on, breathing between each point.",
    },
  ],
  hindi: [
    {
      id: "hi-sc-coffee", context: "रोज़मर्रा", title: "कैफ़े में ऑर्डर",
      prompt: "बरिस्ता पूछता है: “नमस्ते, आपके लिए क्या लाऊँ?”",
      model: [
        "नमस्ते।",
        "मुझे एक मीडियम कॉफ़ी चाहिए, चीनी थोड़ी कम।",
        "और एक छोटा सैंडविच।",
        "बस इतना ही, धन्यवाद।",
      ],
      yourTurn: "अब अपनी पसंद का ऑर्डर दें, हर पंक्ति से पहले एक आराम से साँस लें।",
    },
    {
      id: "hi-sc-intro", context: "कार्यस्थल", title: "अपना परिचय देना",
      prompt: "नई टीम में कोई पूछता है: “अपने बारे में कुछ बताइए?”",
      model: [
        "ज़रूर।",
        "मेरा नाम अर्जुन है, और मैं अभी डिज़ाइन टीम में शामिल हुआ हूँ।",
        "इससे पहले मैंने तीन साल ऐप्स पर काम किया।",
        "मैं सबके साथ काम करने के लिए उत्सुक हूँ।",
      ],
      yourTurn: "चार छोटी पंक्तियों में अपना परिचय दें। हर पंक्ति से पहले शांति से साँस लें।",
    },
    {
      id: "hi-sc-reschedule", context: "फ़ोन कॉल", title: "समय बदलवाना",
      prompt: "आप क्लिनिक फ़ोन करते हैं: रिसेप्शनिस्ट कहता है, “मैं कैसे मदद करूँ?”",
      model: [
        "नमस्ते, मुझे अपनी अपॉइंटमेंट का समय बदलवाना है।",
        "अभी यह गुरुवार दोपहर के लिए है।",
        "क्या इसे सोमवार को किया जा सकता है?",
        "अगर सुबह का समय मिले तो बेहतर रहेगा।",
      ],
      yourTurn: "अपनी कोई बुकिंग बदलवाने की बात करें। एक साँस में एक विचार।",
    },
    {
      id: "hi-sc-update", context: "कार्यस्थल", title: "छोटी अपडेट",
      prompt: "मीटिंग में मैनेजर पूछता है: “काम कहाँ तक पहुँचा?”",
      model: [
        "हमने पहला चरण कल पूरा कर लिया।",
        "अभी मैं टेस्टिंग की राय देख रहा हूँ।",
        "कल तक सारांश तैयार हो जाएगा।",
        "उसके बाद हम आगे की योजना साथ बनाएँगे।",
      ],
      yourTurn: "अपने किसी काम की छोटी अपडेट दें, हर बात के बीच साँस लें।",
    },
  ],
  hinglish: [
    {
      id: "hg-sc-coffee", context: "Everyday", title: "Café mein order",
      prompt: "Barista poochta hai: “Hi, aapke liye kya laaun?”",
      model: [
        "Hi, good morning.",
        "Ek medium latte dena, please, oat milk ke saath.",
        "Aur ek chhota croissant.",
        "Bas itna hi, thank you.",
      ],
      yourTurn: "Ab apni pasand ka order do, har line se pehle aaram se saans lo.",
    },
    {
      id: "hg-sc-intro", context: "Work", title: "Apna intro dena",
      prompt: "Nayi team meeting mein koi poochta hai: “Apne baare mein kuch batao?”",
      model: [
        "Sure, bilkul.",
        "Mera naam Arjun hai, aur main abhi design team mein join hua hoon.",
        "Isse pehle maine teen saal apps par kaam kiya.",
        "Main sabke saath kaam karne ke liye excited hoon.",
      ],
      yourTurn: "Chaar chhoti lines mein apna intro do. Har line se pehle calm saans lo.",
    },
    {
      id: "hg-sc-reschedule", context: "Phone call", title: "Appointment reschedule",
      prompt: "Aap clinic call karte ho: receptionist kehta hai, “How can I help?”",
      model: [
        "Hello, mujhe apni appointment reschedule karni hai.",
        "Abhi yeh Thursday afternoon ke liye hai.",
        "Kya ise next Monday kar sakte hain?",
        "Morning ka slot mile to best rahega.",
      ],
      yourTurn: "Apni koi booking change karne ki baat karo. Ek saans mein ek idea.",
    },
    {
      id: "hg-sc-update", context: "Work", title: "Quick update",
      prompt: "Stand-up mein manager poochta hai: “Kaam kahan tak pahuncha?”",
      model: [
        "Humne first phase kal complete kiya.",
        "Abhi main testing ka feedback review kar raha hoon.",
        "Kal tak summary ready ho jayegi.",
        "Uske baad hum next steps saath plan karenge.",
      ],
      yourTurn: "Apne kisi kaam ki short update do, har point ke beech saans lete hue.",
    },
  ],
};

/** Pick a scenario for a language deterministically by index (stable within a session). */
export function scenarioFor(language: Language, index: number): Scenario {
  const list = scenarios[language];
  return list[index % list.length];
}
