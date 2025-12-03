type ChatbotLocalAnswer = {
  reply: string;
  confidence: "high" | "medium" | "low";
};

type MedicationGuide = {
  name: string;
  keywords: string[];
  use: string;
  dosage: string;
  sideEffects: string;
  warnings: string;
};

const medicationGuides: MedicationGuide[] = [
  {
    name: "Paracetamol (Acetaminophen)",
    keywords: ["paracetamol", "acetaminophen", "crocin", "tylenol", "dolo", "dolo 650", "calpol"],
    use: "Lowers fever and relieves mild to moderate pain such as headaches, body aches, and toothaches.",
    dosage:
      "Adults commonly take 500–1000 mg every 6 hours. Do not exceed 4000 mg in 24 hours. Children need weight-based doses.",
    sideEffects: "Generally well tolerated; occasional nausea, rash, or stomach upset.",
    warnings:
      "Avoid combining with other medicines that also contain paracetamol. People with severe liver disease should talk to their doctor first.",
  },
  {
    name: "Ibuprofen",
    keywords: ["ibuprofen", "brufen", "advil", "motrin", "ibugesic"],
    use: "Non-steroidal anti-inflammatory drug (NSAID) for pain, cramps, inflammation, and fever.",
    dosage:
      "Adults: 200–400 mg every 6–8 hours after food. Maximum 1200 mg over the counter in 24 hours unless a doctor says otherwise.",
    sideEffects:
      "Stomach upset, heartburn, dizziness, or swelling. Long-term use may increase risk of ulcers or kidney strain.",
    warnings:
      "Avoid if you have stomach ulcers, severe kidney disease, or are in the last trimester of pregnancy. Do not mix with other NSAIDs.",
  },
  {
    name: "Aspirin / Disprin (75–325 mg)",
    keywords: ["aspirin", "disprin"],
    use: "Low-dose aspirin prevents blood clots in heart disease; higher doses reduce pain or fever.",
    dosage:
      "For clot prevention, doctors usually prescribe 75–150 mg once daily. Pain doses (325–650 mg) should only be used short term.",
    sideEffects:
      "Stomach irritation, bleeding risk, ringing in ears at high doses.",
    warnings:
      "Not for children with viral fever (risk of Reye’s syndrome). Avoid if you have ulcers, bleeding disorders, or aspirin allergy.",
  },
  {
    name: "Diclofenac",
    keywords: ["diclofenac", "voltaren", "voveran"],
    use: "NSAID used to relieve inflammatory pain such as sprains, back pain, or arthritis.",
    dosage:
      "Typical adult dose is 50 mg two to three times daily after meals. Do not exceed 150 mg per day without medical supervision.",
    sideEffects:
      "Stomach irritation, acidity, dizziness, fluid retention. Long-term use increases risk of ulcers, kidney strain, or cardiovascular issues.",
    warnings:
      "Avoid if you have stomach ulcers, severe liver/kidney disease, heart failure, or are in late pregnancy. Take with food and consider stomach-protective medicine if prescribed.",
  },
  {
    name: "Nimesulide",
    keywords: ["nimesulide", "nise"],
    use: "NSAID for pain and fever when other options are unsuitable.",
    dosage:
      "Adults generally take 100 mg twice daily after food for the shortest duration possible.",
    sideEffects: "Nausea, dizziness, liver enzyme elevation.",
    warnings:
      "Avoid in children and people with liver disease. Use only under medical supervision.",
  },
  {
    name: "Ketorolac",
    keywords: ["ketorolac", "ketanov"],
    use: "Strong NSAID for short-term severe pain (injuries, post-operative).",
    dosage:
      "10 mg every 6 hours for up to 5 days maximum unless a doctor directs otherwise.",
    sideEffects: "Stomach irritation, bleeding, kidney strain.",
    warnings:
      "Prescription-only. Not for chronic use. Avoid with ulcers, kidney disease, or anticoagulants.",
  },
  {
    name: "Tramadol",
    keywords: ["tramadol"],
    use: "Opioid-like painkiller for moderate to severe pain (post-surgery, trauma).",
    dosage:
      "50–100 mg every 6–8 hours as prescribed. Maximum 400 mg/day.",
    sideEffects: "Drowsiness, nausea, constipation, risk of dependence.",
    warnings:
      "Prescription-only. Avoid with alcohol, sedatives, or seizure disorders.",
  },
  {
    name: "Aceclofenac",
    keywords: ["aceclofenac", "aceclo"],
    use: "NSAID for musculoskeletal pain, back pain, and arthritis.",
    dosage:
      "100 mg twice daily after meals.",
    sideEffects: "Gastric irritation, dizziness, edema.",
    warnings:
      "Avoid in gastric ulcers, severe heart/kidney disease. Use stomach protection if prescribed.",
  },
  {
    name: "Etoricoxib",
    keywords: ["etoricoxib", "etoshine"],
    use: "COX-2 selective NSAID for arthritis, knee pain, and gout flares.",
    dosage:
      "Common doses: 60 mg daily for osteoarthritis, 90 mg for gout (short term).",
    sideEffects: "Fluid retention, raised blood pressure.",
    warnings:
      "Heart patients should avoid unless doctor advises. Not for long-term high doses.",
  },
  {
    name: "Indomethacin",
    keywords: ["indomethacin"],
    use: "NSAID effective for gout pain, swelling, and stiffness.",
    dosage:
      "25–50 mg two or three times daily with food.",
    sideEffects: "Stomach issues, dizziness, headaches.",
    warnings:
      "Avoid with ulcers, severe kidney/liver disease. Use only if prescribed.",
  },
  {
    name: "Cetirizine",
    keywords: ["cetirizine", "zyrtec", "okacet", "allegra", "levocetirizine"],
    use: "Second-generation antihistamine that relieves sneezing, runny nose, itchy eyes, and hives caused by allergies.",
    dosage:
      "Adults: 10 mg once daily, usually at night. Children 2–6 years often use lower doses or syrups—follow pediatric instructions.",
    sideEffects: "Mild drowsiness, dry mouth, or headache. Rarely causes palpitations.",
    warnings:
      "Avoid alcohol or other sedating medicines. Consult a doctor if you have kidney disease, are pregnant, or breastfeeding.",
  },
  {
    name: "Paracetamol (Acetaminophen)",
    keywords: ["paracetamol", "acetaminophen", "crocin", "tylenol"],
    use: "Lowers fever and relieves mild to moderate pain such as headaches, body aches, and toothaches.",
    dosage:
      "Adults commonly take 500–1000 mg every 6 hours. Do not exceed 4000 mg in 24 hours. Children need weight-based doses.",
    sideEffects: "Generally well tolerated; occasional nausea, rash, or stomach upset.",
    warnings:
      "Avoid combining with other medicines that also contain paracetamol. People with severe liver disease should talk to their doctor first.",
  },
  {
    name: "Ibuprofen",
    keywords: ["ibuprofen", "brufen", "advil", "motrin"],
    use: "Non-steroidal anti-inflammatory drug (NSAID) for pain, cramps, inflammation, and fever.",
    dosage:
      "Adults: 200–400 mg every 6–8 hours after food. Maximum 1200 mg over the counter in 24 hours unless a doctor says otherwise.",
    sideEffects:
      "Stomach upset, heartburn, dizziness, or swelling. Long-term use may increase risk of ulcers or kidney strain.",
    warnings:
      "Avoid if you have stomach ulcers, severe kidney disease, or are in the last trimester of pregnancy. Do not mix with other NSAIDs.",
  },
  {
    name: "Amoxicillin",
    keywords: ["amoxicillin", "augmentin", "amox"],
    use: "Antibiotic used for bacterial throat, ear, chest, urinary, and skin infections.",
    dosage:
      "Adults often take 500 mg every 8 hours or 875 mg every 12 hours. Complete the full course even if you feel better.",
    sideEffects:
      "Nausea, loose stools, rash. Rarely causes allergic swelling or breathing difficulty—this is an emergency.",
    warnings:
      "Only take when prescribed for a confirmed bacterial infection. Tell your doctor if you are allergic to penicillin.",
  },
  {
    name: "Metformin",
    keywords: ["metformin", "glycomet", "gluformin"],
    use: "First-line medicine for type 2 diabetes to improve blood sugar control.",
    dosage:
      "Typical starting dose is 500 mg once or twice daily with meals. Dose may increase slowly to reduce stomach upset.",
    sideEffects:
      "Nausea, diarrhea, metallic taste—usually improve over time. Very rarely, lactic acidosis (seek urgent care if severe weakness or breathing trouble).",
    warnings:
      "Avoid heavy alcohol use. Let your doctor know before X-ray dye studies or surgery. Not for severe kidney or liver failure.",
  },
  {
    name: "Vitamin D3",
    keywords: ["vitamin d", "cholecalciferol", "d3"],
    use: "Supports calcium absorption, bone strength, and immune health. Used in vitamin D deficiency.",
    dosage:
      "Daily tablets/capsules (e.g., 1000–2000 IU) or weekly high-dose sachets as prescribed. Always follow your doctor’s plan.",
    sideEffects: "Rare at normal doses. Very high doses can cause thirst, nausea, or high calcium levels.",
    warnings:
      "Do not megadose unless advised. Tell your doctor if you have kidney stones, high calcium, or sarcoidosis.",
  },
  {
    name: "Cetirizine",
    keywords: ["cetirizine", "zyrtec", "okacet", "allegra"],
    use: "Second-generation antihistamine that relieves sneezing, runny nose, itchy eyes, and hives caused by allergies.",
    dosage:
      "Adults: 10 mg once daily, usually at night. Children 2–6 years often use lower doses or syrups—follow pediatric instructions.",
    sideEffects: "Mild drowsiness, dry mouth, or headache. Rarely causes palpitations.",
    warnings:
      "Avoid alcohol or other sedating medicines. Consult a doctor if you have kidney disease, are pregnant, or breastfeeding.",
  },
  {
    name: "Omeprazole",
    keywords: ["omeprazole", "prilosec", "omez"],
    use: "Proton pump inhibitor that reduces stomach acid to treat reflux, gastritis, and ulcers.",
    dosage:
      "Common OTC dose is 20 mg once daily 30 minutes before breakfast for 14 days. Doctors may prescribe longer courses.",
    sideEffects:
      "Headache, abdominal discomfort, constipation or diarrhea. Long-term use may reduce magnesium or B12 levels.",
    warnings:
      "See a doctor for alarm signs like weight loss, vomiting blood, or black stools. Do not combine with clopidogrel without medical advice.",
  },
  {
    name: "Losartan",
    keywords: ["losartan", "cozaar"],
    use: "Angiotensin receptor blocker (ARB) used to lower blood pressure and protect the kidneys in diabetes.",
    dosage:
      "Typical starting dose is 50 mg once daily. Some people take 25 mg or 100 mg depending on response. Take at the same time daily.",
    sideEffects:
      "Dizziness, especially when starting, and high potassium levels. Rarely causes swelling of lips or face.",
    warnings:
      "Not for pregnancy. Monitor blood pressure, kidney function, and potassium. Tell your doctor if you develop muscle weakness or palpitations.",
  },
  {
    name: "Oral Rehydration Salts (ORS)",
    keywords: ["ors", "oral rehydration", "rehydration salts", "electrolyte powder"],
    use: "A balanced mix of glucose and electrolytes to treat dehydration from diarrhea, vomiting, or heat exposure.",
    dosage:
      "Dissolve one sachet in the exact amount of clean water stated on the packet (usually 1 liter). Sip small amounts frequently after each loose stool or vomit.",
    sideEffects: "Very safe when prepared correctly; too concentrated solution may cause high sodium.",
    warnings:
      "Seek urgent care if there is persistent vomiting, blood in stool, high fever, or signs of severe dehydration (sunken eyes, no urine, lethargy).",
  },
  {
    name: "Cold & Flu Combination Tablets (e.g., Nocold)",
    keywords: ["nocold", "no cold", "cold tablet", "cold tablets", "cold flu tablet", "vicks action", "action 500"],
    use: "Usually a mix of paracetamol for fever, phenylephrine for blocked nose, chlorpheniramine or cetirizine for allergies, and caffeine for alertness.",
    dosage:
      "Adults typically take 1 tablet every 6–8 hours after food. Do not exceed 4 tablets in 24 hours, and avoid taking extra paracetamol separately.",
    sideEffects:
      "Drowsiness, dry mouth, palpitations, raised blood pressure, or stomach upset. Caffeine can cause restlessness.",
    warnings:
      "Avoid if you have uncontrolled high blood pressure, heart rhythm issues, glaucoma, or are on monoamine oxidase inhibitors (MAOIs). Do not use for children under 12 without a doctor. Stop and seek care if you develop chest pain, severe dizziness, or trouble breathing.",
  },
  {
    name: "Azithromycin",
    keywords: ["azithromycin", "azit", "zithromax"],
    use: "Antibiotic for certain bacterial throat, sinus, chest, or skin infections.",
    dosage:
      "Common adult regimen is 500 mg once daily for 3 days or 500 mg on day 1 followed by 250 mg on days 2–5. Take exactly as prescribed and complete the course.",
    sideEffects:
      "Loose stools, nausea, abdominal pain. Rarely causes liver problems or heart rhythm changes.",
    warnings:
      "Do not use for viral infections like the common cold. Tell your doctor if you have liver disease, heart rhythm disorders, or are on other QT-prolonging drugs.",
  },
  {
    name: "Diclofenac",
    keywords: ["diclofenac", "voltaren", "voveran"],
    use: "NSAID used to relieve inflammatory pain such as sprains, back pain, or arthritis.",
    dosage:
      "Typical adult dose is 50 mg two to three times daily after meals. Do not exceed 150 mg per day without medical supervision.",
    sideEffects:
      "Stomach irritation, acidity, dizziness, fluid retention. Long-term use increases risk of ulcers, kidney strain, or cardiovascular issues.",
    warnings:
      "Avoid if you have stomach ulcers, severe liver/kidney disease, heart failure, or are in late pregnancy. Take with food and consider stomach-protective medicine if prescribed.",
  },
  {
    name: "Pantoprazole",
    keywords: ["pantoprazole", "panto", "protonix"],
    use: "Proton pump inhibitor similar to omeprazole, used for acid reflux, ulcers, and gastritis.",
    dosage:
      "Common dose is 40 mg once daily before breakfast. Some regimens use twice daily dosing for severe cases as advised by a doctor.",
    sideEffects:
      "Headache, abdominal discomfort, diarrhea or constipation. Long-term use may reduce magnesium, B12, and increase fracture risk.",
    warnings:
      "Consult a doctor if you require more than 14 days of OTC use or if you have alarm symptoms (weight loss, vomiting blood, black stools).",
  },
  {
    name: "Iron + Folic Acid Supplements",
    keywords: ["iron tablet", "ferrous", "folic acid", "ifas", "haem up", "dexorange"],
    use: "Treats or prevents iron-deficiency anemia, especially in pregnancy or chronic blood loss.",
    dosage:
      "Common adult dose is 60–100 mg elemental iron once or twice daily with folic acid. Take on an empty stomach with vitamin C–rich juice if tolerated.",
    sideEffects:
      "Metallic taste, dark stools, constipation, or nausea. Taking with a light snack can reduce stomach upset.",
    warnings:
      "Keep out of reach of children (overdose can be dangerous). Avoid taking with tea/coffee/dairy at the same time. People with iron overload disorders should not use without medical advice.",
  },
];

const generalTopics: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["fever", "temperature"],
    reply:
      "Fever tips: take paracetamol as directed, drink plenty of water, use a cool wet cloth on the forehead, rest, and eat light foods. See a doctor if temperature stays above 101°F for 3 days or there is severe weakness/dehydration.",
  },
  {
    keywords: ["cold", "runny nose", "sneezing"],
    reply:
      "Common cold: steam inhalation 2–3 times per day, warm water, cetirizine for runny nose (causes drowsiness), ginger tea or honey water, and rest. See a doctor if symptoms persist beyond 7 days or high fever develops.",
  },
  {
    keywords: ["cough", "dry cough", "wet cough"],
    reply:
      "Dry cough → dextromethorphan syrup. Wet cough → ambroxol/bromhexine syrup plus plenty of water. Use warm salt-water gargles, steam inhalation, and avoid cold drinks. Seek care if cough lasts more than a week or has blood.",
  },
  {
    keywords: ["headache", "migraine"],
    reply:
      "Headache relief: drink 1–2 glasses of water, rest in a quiet dark room, take paracetamol if suitable, avoid long mobile/TV use, and try deep breathing or gentle neck stretches. See a doctor if headaches occur daily, follow a head injury, are worst-ever, or cause vomiting/vision changes.",
  },
  {
    keywords: ["acidity", "gas", "heartburn"],
    reply:
      "Acidity/gas: take pantoprazole or omeprazole on an empty stomach, avoid spicy/oily food, eat 2–3 hours before sleep, drink buttermilk/coconut water, and don’t skip meals. See a doctor for chest pain or persistent acidity.",
  },
  {
    keywords: ["stomach pain", "cramps", "abdominal pain"],
    reply:
      "Stomach cramps: dicyclomine helps spasms, ORS for loose motions, eat light foods (khichdi, curd rice), avoid milk temporarily, and take short walks. Seek urgent care if pain is sharp, unbearable, or there is vomiting blood.",
  },
  {
    keywords: ["diarrhea", "loose motion"],
    reply:
      "Loose motion: drink ORS every 30 minutes, eat bananas/curd/rice, avoid oily food, take zinc tablets for recovery. See a doctor immediately for blood in stool or severe dehydration (no urine, sunken eyes).",
  },
  {
    keywords: ["constipation"],
    reply:
      "Constipation: drink 2–3 liters of water, eat papaya/banana/oatmeal, include fiber-rich veggies and fruits, walk daily, and use mild laxatives only if required. Persistent constipation needs medical advice.",
  },
  {
    keywords: ["allergy", "sneezing", "rhinitis"],
    reply:
      "Allergy/sneezing: levocetirizine or cetirizine (preferably at night), wear a mask outdoors, keep rooms clean, drink warm water, and do steam inhalation. See a doctor for breathing difficulty or frequent attacks.",
  },
  {
    keywords: ["body pain", "muscle pain", "back pain"],
    reply:
      "Body or back pain: use ibuprofen or aceclofenac if suitable, apply warm compresses, take a warm bath, do light stretching and posture correction, and stay hydrated. Avoid lifting heavy weights. Seek urgent care for pain after a fall, pain going down the legs with numbness, or loss of bladder/bowel control.",
  },
  {
    keywords: ["sore throat"],
    reply:
      "Sore throat: warm salt-water gargles, hot tea with honey, avoid cold drinks, and rest your voice. Antibiotics like azithromycin should be used only if a doctor prescribes them.",
  },
  {
    keywords: ["skin rash", "rashes", "fungal infection"],
    reply:
      "Skin rashes: keep the area dry, apply hydrocortisone for mild allergy rash, or antifungal creams (ketoconazole/terbinafine) for fungal infections. Seek medical care if rash spreads or has pus.",
  },
  {
    keywords: ["eye burn", "red eye", "eye redness"],
    reply:
      "Eye pain or burning: rinse eyes with clean water, rest from screens, avoid rubbing, and use lubricating drops if available. If redness with discharge or suspected infection, a doctor may prescribe antibiotic drops like ofloxacin. Go to emergency care for sudden vision loss, severe pain, or eye injury.",
  },
  {
    keywords: ["weakness", "fatigue", "tired"],
    reply:
      "Weakness/fatigue: ensure at least 7 hours sleep, eat balanced meals, take vitamin B-complex or iron if prescribed, and hydrate with water or ORS. Persistent weakness needs medical evaluation.",
  },
  {
    keywords: ["emergency", "breathing", "chest pain", "stroke", "heart attack"],
    reply:
      "Severe chest pain, trouble breathing, sudden weakness, seizures, or major injuries are emergencies—call local emergency services or go to the nearest hospital immediately. Do not wait for the app.",
  },
];

const DISLCAIMER =
  "This information is educational and not a substitute for medical advice. Always consult a qualified doctor or pharmacist for personal guidance.";

export const getLocalChatbotReply = (message: string): ChatbotLocalAnswer => {
  const normalized = message.toLowerCase();

  if (!normalized.trim()) {
    return {
      reply:
        "Please describe your question—for example, ask about a medicine, dosage timing, or a symptom like fever or cough.",
      confidence: "low",
    };
  }

  const emergencyKeywords = ["chest pain", "stroke", "can’t breathe", "cannot breathe", "unconscious", "seizure"];
  if (emergencyKeywords.some((word) => normalized.includes(word))) {
    return {
      reply:
        "This sounds urgent. Call your local emergency number or go to the nearest hospital immediately. Do not rely on the app for emergencies. " +
        DISLCAIMER,
      confidence: "high",
    };
  }

  for (const topic of generalTopics) {
    if (topic.keywords.some((word) => normalized.includes(word))) {
      return {
        reply: `${topic.reply} ${DISLCAIMER}`,
        confidence: "medium",
      };
    }
  }

  for (const guide of medicationGuides) {
    if (guide.keywords.some((word) => normalized.includes(word))) {
      return {
        reply: `${guide.name}\n• Use: ${guide.use}\n• Typical dose: ${guide.dosage}\n• Common side effects: ${guide.sideEffects}\n• Safety: ${guide.warnings}\n${DISLCAIMER}`,
        confidence: "high",
      };
    }
  }

  return {
    reply:
      "I don’t have specific details for that medicine yet. Try asking about fever care, blood pressure, diabetes, or common tablets like paracetamol, ibuprofen, amoxicillin, metformin, or vitamin D. " +
      DISLCAIMER,
    confidence: "low",
  };
};


