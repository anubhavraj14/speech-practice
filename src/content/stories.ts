import type { Difficulty, Language } from "@/lib/types";

/**
 * Simple, modern short stories used for the "Book passage" reading practice.
 *
 * These replace archaic/complex online sources for Hindi and Hinglish (where no
 * good simple online source exists) and act as a reliable fallback everywhere.
 * Hinglish is genuine Hindi-English code-mixing in Roman script — NOT English.
 * Sentences are kept short and natural so the breath pacer can phrase them well.
 */
export interface Story {
  id: string;
  difficulty: Difficulty;
  title: string;
  sentences: string[];
}

export const stories: Record<Language, Story[]> = {
  english: [
    {
      id: "story-en-crow", difficulty: "easy", title: "The Thirsty Crow",
      sentences: [
        "One hot summer afternoon, a thirsty crow was looking for water.",
        "He flew over fields and gardens, but every pot he found was empty.",
        "At last, he saw a tall jug with a little water at the bottom.",
        "The crow tried to reach the water, but his beak was too short.",
        "Then he had a clever idea.",
        "He picked up small stones and dropped them into the jug, one by one.",
        "Slowly, the water rose higher and higher.",
        "Soon the crow could drink easily, and he flew away happy.",
      ],
    },
    {
      id: "story-en-lion", difficulty: "easy", title: "The Lion and the Mouse",
      sentences: [
        "A big lion was sleeping under a shady tree.",
        "A little mouse ran across his paw and woke him up.",
        "The angry lion caught the mouse and was about to eat him.",
        "Please let me go, said the mouse, and one day I will help you.",
        "The lion laughed, but he set the little mouse free.",
        "A few days later, the lion was caught in a hunter's net.",
        "He roared loudly, and the mouse came running to help.",
        "The mouse chewed through the ropes and set the lion free.",
        "From that day, the big lion and the little mouse were good friends.",
      ],
    },
    {
      id: "story-en-cycle", difficulty: "medium", title: "A New Bicycle",
      sentences: [
        "Meera had wanted a bicycle for a very long time.",
        "Instead of asking her parents to buy one, she decided to save her own money.",
        "Every week, she kept a small part of her pocket money in a jar.",
        "She also helped her neighbours with small jobs on the weekends.",
        "It took almost six months, but the jar slowly became full.",
        "On her birthday, she counted the coins and finally bought a bright blue bicycle.",
        "She felt proud, because she had earned it all by herself.",
        "Now, every evening, she rides around the park with a big smile.",
      ],
    },
    {
      id: "story-en-neighbour", difficulty: "advanced", title: "The Kind Neighbour",
      sentences: [
        "When the Sharma family moved into the new building, they did not know anyone.",
        "The city felt busy and strange, and their flat was full of unopened boxes.",
        "On the first evening, there was a soft knock at the door.",
        "It was their neighbour, an old woman named Mrs. Rao, holding a plate of warm food.",
        "She smiled and said that nobody should cook on the day they move.",
        "Over the next few weeks, she helped them in many small ways.",
        "She showed them the nearest market, the best vegetable shop, and a quiet park.",
        "Slowly, the strange city began to feel like home.",
        "The Sharmas learned that a little kindness can make a big difference.",
        "They promised themselves that they would welcome the next new family in the same way.",
      ],
    },
  ],
  hindi: [
    {
      id: "story-hi-crow", difficulty: "easy", title: "प्यासा कौआ",
      sentences: [
        "गर्मी की एक दोपहर, एक प्यासा कौआ पानी की तलाश में था।",
        "वह खेतों और बगीचों के ऊपर उड़ता रहा, पर हर बर्तन खाली था।",
        "आख़िर उसे एक ऊँचा घड़ा दिखा, जिसमें थोड़ा-सा पानी था।",
        "कौए ने पानी तक पहुँचने की कोशिश की, पर उसकी चोंच छोटी पड़ गई।",
        "तभी उसके मन में एक चतुर विचार आया।",
        "उसने छोटे-छोटे पत्थर उठाकर एक-एक करके घड़े में डाले।",
        "धीरे-धीरे पानी ऊपर आता गया।",
        "जल्दी ही कौआ आराम से पानी पी सका और खुशी-खुशी उड़ गया।",
      ],
    },
    {
      id: "story-hi-lion", difficulty: "easy", title: "शेर और चूहा",
      sentences: [
        "एक बड़ा शेर पेड़ की छाँव में सो रहा था।",
        "एक छोटा चूहा उसके पंजे पर से दौड़ा और शेर जाग गया।",
        "गुस्से में शेर ने चूहे को पकड़ लिया।",
        "चूहे ने कहा, मुझे छोड़ दीजिए, एक दिन मैं आपकी मदद करूँगा।",
        "शेर हँसा, पर उसने चूहे को छोड़ दिया।",
        "कुछ दिन बाद शेर एक शिकारी के जाल में फँस गया।",
        "वह ज़ोर से दहाड़ा, और चूहा दौड़ता हुआ आया।",
        "चूहे ने रस्सियाँ कुतर दीं और शेर को आज़ाद कर दिया।",
        "उस दिन से शेर और चूहा अच्छे दोस्त बन गए।",
      ],
    },
    {
      id: "story-hi-cycle", difficulty: "medium", title: "नई साइकिल",
      sentences: [
        "मीरा को बहुत समय से एक साइकिल चाहिए थी।",
        "माता-पिता से माँगने के बजाय, उसने अपने पैसे जोड़ने का फैसला किया।",
        "हर हफ़्ते वह अपनी जेब-खर्च का थोड़ा हिस्सा एक डिब्बे में रखती।",
        "वह सप्ताहांत पर पड़ोसियों के छोटे काम भी कर देती थी।",
        "लगभग छह महीने लगे, पर डिब्बा धीरे-धीरे भर गया।",
        "अपने जन्मदिन पर उसने सिक्के गिने और एक नीली साइकिल खरीदी।",
        "उसे गर्व हुआ, क्योंकि उसने यह सब खुद कमाया था।",
        "अब हर शाम वह बड़ी मुस्कान के साथ पार्क में साइकिल चलाती है।",
      ],
    },
    {
      id: "story-hi-neighbour", difficulty: "advanced", title: "मददगार पड़ोसी",
      sentences: [
        "जब शर्मा परिवार नई इमारत में आया, तो वे किसी को नहीं जानते थे।",
        "शहर व्यस्त और अजनबी लगता था, और उनका घर खुले डिब्बों से भरा था।",
        "पहली शाम दरवाज़े पर हल्की-सी दस्तक हुई।",
        "यह उनकी पड़ोसी थीं, एक बुज़ुर्ग महिला, राव जी, जो गरम खाने की थाली लिए खड़ी थीं।",
        "उन्होंने मुस्कुराकर कहा कि सामान शिफ्ट करने के दिन किसी को खाना नहीं बनाना चाहिए।",
        "अगले कुछ हफ़्तों में उन्होंने कई छोटे-छोटे तरीकों से मदद की।",
        "उन्होंने पास का बाज़ार, अच्छी सब्ज़ी की दुकान और एक शांत पार्क दिखाया।",
        "धीरे-धीरे अजनबी शहर अपना-सा लगने लगा।",
        "शर्मा परिवार ने सीखा कि थोड़ी-सी दया बड़ा फर्क ला सकती है।",
        "उन्होंने खुद से वादा किया कि वे अगले नए परिवार का भी ऐसे ही स्वागत करेंगे।",
      ],
    },
  ],
  hinglish: [
    {
      id: "story-hg-crow", difficulty: "easy", title: "Pyaasa Kauaa",
      sentences: [
        "Garmi ki ek dopahar, ek pyaasa crow paani dhoondh raha tha.",
        "Woh fields aur gardens ke upar udta raha, par har pot khaali tha.",
        "Aakhir use ek tall jug dikha, jisme thoda-sa paani tha.",
        "Crow ne paani tak pahunchne ki koshish ki, par uski beak choti pad gayi.",
        "Tabhi uske mann mein ek clever idea aaya.",
        "Usne chote-chote stones uthakar ek-ek karke jug mein daale.",
        "Dheere-dheere paani upar aata gaya.",
        "Jaldi hi crow aaram se paani pee saka aur khushi-khushi ud gaya.",
      ],
    },
    {
      id: "story-hg-lion", difficulty: "easy", title: "Sher aur Chuha",
      sentences: [
        "Ek bada lion ek tree ki chhaanv mein so raha tha.",
        "Ek chota mouse uske paw par se bhaaga aur lion jaag gaya.",
        "Gusse mein lion ne mouse ko pakad liya.",
        "Mouse ne kaha, mujhe chhod do, ek din main aapki help karunga.",
        "Lion hansa, par usne mouse ko chhod diya.",
        "Kuch din baad lion ek hunter ke net mein fas gaya.",
        "Woh zor se dahaada, aur mouse daudta hua aaya.",
        "Mouse ne ropes ko kutar diya aur lion ko aazaad kar diya.",
        "Us din se lion aur mouse acche dost ban gaye.",
      ],
    },
    {
      id: "story-hg-cycle", difficulty: "medium", title: "Nayi Cycle",
      sentences: [
        "Meera ko bahut time se ek cycle chahiye thi.",
        "Parents se maangne ke bajaye, usne apne paise save karne ka decide kiya.",
        "Har week woh apni pocket money ka thoda hissa ek jar mein rakhti.",
        "Woh weekend par neighbours ke chote kaam bhi kar deti thi.",
        "Lagbhag chhe mahine lage, par jar dheere-dheere bhar gaya.",
        "Apne birthday par usne coins gine aur ek blue cycle khareedi.",
        "Use proud feel hua, kyunki usne yeh sab khud earn kiya tha.",
        "Ab har shaam woh badi smile ke saath park mein cycle chalati hai.",
      ],
    },
    {
      id: "story-hg-neighbour", difficulty: "advanced", title: "Helpful Neighbour",
      sentences: [
        "Jab Sharma family nayi building mein aayi, toh woh kisi ko nahi jaante the.",
        "City busy aur strange lagti thi, aur unka flat khule boxes se bhara tha.",
        "Pehli shaam darwaze par ek halki-si knock hui.",
        "Yeh unki neighbour thi, ek buzurg lady, Mrs. Rao, jo garam khane ki plate liye khadi thi.",
        "Unhone muskura kar kaha ki shift karne ke din kisi ko khana nahi banana chahiye.",
        "Agle kuch weeks mein unhone kai chote tarikon se help ki.",
        "Unhone paas ka market, acchi vegetable shop aur ek quiet park dikhaya.",
        "Dheere-dheere strange city apni-si lagne lagi.",
        "Sharma family ne seekha ki thodi-si kindness bada farak la sakti hai.",
        "Unhone khud se promise kiya ki woh agle naye family ka bhi aise hi welcome karenge.",
      ],
    },
  ],
};
