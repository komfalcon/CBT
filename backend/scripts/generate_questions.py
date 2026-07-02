import json
import re
import urllib.request
import urllib.error
import os
import time
import argparse

# --- CONFIGURATION ---
API_KEY = os.environ.get("DIGITALOCEAN_INFERENCE_KEY", "doo_v1_e34216c62ca589898497de42ed157735f9ae238f828b7e3378d76fec667141d1")
API_URL = "https://inference.do-ai.run/v1/chat/completions"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# --- MODEL ROUTING MAP (From DigitalOcean Inference Model Comparison Table) ---
SUBJECT_MODELS = {
    "government": "llama-4-maverick",
    "crs": "llama-4-maverick",
    "irs":"llama-4-maverick",
    "history": "llama-4-maverick",
    "commerce": "llama-4-maverick",
    "agriculture": "llama-4-maverick",
    "accounts": "llama3.3-70b-instruct",
    "literature":"llama-4-maverick",
    "mathematics": "nvidia-nemotron-3-super-120b",
    "civic":"llama-4-maverick",
    "further_mathematics": "nvidia-nemotron-3-super-120b",
    "physics": "nvidia-nemotron-3-super-120b",
    "chemistry": "nvidia-nemotron-3-super-120b",
    "biology": "llama-4-maverick",
    "economics": "router:knowledge-base-document",
    "geography": "router:knowledge-base-document",
    "english": "nemotron-3-ultra-550b"
}

DEFAULT_PREMIUM_MODEL = "llama-4-maverick"

# --- SUBJECT CURRICULUMS ---
CURRICULUMS = {
    "chemistry": {
        "topics": [
            "Atomic Structure and Periodicity", "Chemical Bonding", "Stoichiometry",
            "States of Matter", "Thermochemistry", "Chemical Kinetics and Equilibrium",
            "Electrochemistry", "Acids, Bases and Salts", "Organic Chemistry", "Environmental Chemistry"
        ],
        "subtopics": [
            "Atomic Number and Mass Number", "Isotopes", "Electronic Configuration", "Periodic Trends",
            "Ionic Bonding", "Covalent Bonding", "Metallic Bonding", "Intermolecular Forces",
            "Mole Concept", "Empirical and Molecular Formula", "Stoichiometric Calculations",
            "Gas Laws", "Kinetic Theory", "Solubility", "Enthalpy Changes", "Hess's Law",
            "Reaction Rates", "Le Chatelier's Principle", "Electrolysis", "Electrochemical Cells",
            "Faraday's Laws", "pH and Indicators", "Neutralisation", "Salt Hydrolysis",
            "Buffer Solutions", "Hydrocarbons", "Functional Groups", "Isomerism",
            "Addition and Substitution Reactions", "Polymers", "Air and Water Pollution"
        ]
    },
    "physics": {
        "topics": [
            "Mechanics", "Thermal Physics", "Waves and Optics", "Electricity and Magnetism", "Modern Physics"
        ],
        "subtopics": [
            "Vectors and Scalars", "Linear Motion", "Projectiles", "Newton's Laws", "Work, Energy and Power",
            "Simple Harmonic Motion", "Gravitational Fields", "Temperature and Heat Capacity", "Gas Laws",
            "Latent Heat", "Thermodynamics", "Reflection and Refraction", "Lenses and Mirrors", "Wave Properties",
            "Electrostatics", "Electric Fields", "Current Electricity", "Ohm's Law", "Electromagnetism",
            "Electromagnetic Induction", "Alternating Current", "Radioactivity", "Photoelectric Effect", "X-rays"
        ]
    },
    "biology": {
        "topics": [
            "Cell Biology", "Plant Anatomy and Physiology", "Human Anatomy and Physiology", "Genetics and Evolution", "Ecology"
        ],
        "subtopics": [
            "Cell Structure and Organelles", "Mitosis and Meiosis", "Photosynthesis", "Plant Transport",
            "Digestive System", "Circulatory System", "Respiratory System", "Nervous System", "Endocrine System",
            "Excretory System", "Reproductive System", "Mendelian Genetics", "DNA Structure", "Evolutionary Theories",
            "Ecosystems", "Nutrient Cycles", "Population Ecology", "Pollution and Conservation"
        ]
    },
    "mathematics": {
        "topics": [
            "Number and Algebra", "Geometry and Trigonometry", "Calculus", "Statistics and Probability"
        ],
        "subtopics": [
            "Fractions and Decimals", "Indices and Logarithms", "Surds", "Sets", "Quadratic Equations",
            "Simultaneous Equations", "Sequence and Series (AP/GP)", "Matrices and Determinants", "Plane Geometry",
            "Coordinate Geometry", "Trigonometric Ratios", "Differentiation", "Integration", "Limits",
            "Measures of Central Tendency", "Measures of Dispersion", "Permutation and Combination", "Probability"
        ]
    },
    "accounts": {
        "topics": [
            "Introduction to Financial Accounting", "Double Entry Bookkeeping", "Final Accounts of a Sole Trader",
            "Adjustments to Final Accounts", "Partnership Accounts", "Company Accounts", "Departmental and Branch Accounts"
        ],
        "subtopics": [
            "Accounting Principles and Concepts", "Ledger Accounts", "Trial Balance", "Trading Account",
            "Profit and Loss Account", "Balance Sheet", "Depreciation", "Bad Debts and Provisions",
            "Accruals and Prepayments", "Partnership Agreement", "Goodwill Valuation", "Issue of Shares and Debentures",
            "Branch Trial Balance", "Departmental Allocation of Expenses"
        ]
    },
    "english": {
        "topics": [
            "Lexis and Structure", "Comprehension and Sentence Interpretation", "Oral English"
        ],
        "subtopics": [
            "Synonyms and Antonyms", "Homophones", "Idioms and Collocations", "Sentence Completion",
            "Subject-Verb Agreement (Concord)", "Tenses and Aspect", "Active and Passive Voice", "Direct and Indirect Speech",
            "Pronunciation (Vowels/Consonants)", "Stress Patterns (Word and Sentence Stress)"
        ]
    },
    "economics": {
        "topics": [
            "Basic Economic Concepts and Systems", "Theory of Production, Cost and Revenue", "Market Structures", 
            "National Income and Economic Analysis", "Money, Banking and Inflation", "Public Finance", 
            "Economic Growth and Development", "International Trade and Economic Organizations"
        ],
        "subtopics": [
            "Wants, Scarcity, Scale of Preference", "Capitalist, Socialist and Mixed Economies", "Factors of Production", 
            "Short-run and Long-run Costs", "Perfect Competition and Monopolies", "GDP, GNP and NNP Measurement", 
            "Inflation Causes and Controls", "Roles of Central and Commercial Banks", "Direct and Indirect Taxation", 
            "Deficit and Surplus Budgets", "Economic Development Indicators", "Balance of Payments", "ECOWAS and WTO"
        ]
    },
    "government": {
        "topics": [
            "Basic Concepts in Government", "Political Systems and Ideologies", "Constitutional Developments in Nigeria", 
            "Arms of Government and Electoral Processes", "Nigeria's Foreign Policy and International Relations"
        ],
        "subtopics": [
            "Power, Authority and Sovereignty", "State, Nation and Nation-State", "Monarchy, Autocracy and Democracy", 
            "Legislative, Executive and Judiciary Roles", "Federal and Unitary Systems", "Political Parties and Pressure Groups", 
            "Pre-colonial Administration (Hausa, Yoruba, Igbo)", "1979 and 1999 Constitutions", "Nigeria and ECOWAS/UN"
        ]
    },
    "literature": {
        "topics": [
            "Drama and Dramatic Techniques", "Prose and Narrative Devices", "Poetry and Poetic Devices", "General Literary Principles"
        ],
        "subtopics": [
            "Tragedy, Comedy and Tragicomedy", "Soliloquy, Aside and Mime", "Plot, Theme and Setting Analysis", 
            "First and Third Person Narratives", "Biography, Autobiography and Faction", "Metaphor, Simile and Personification", 
            "Rhyme, Rhythm and Sound Devices", "Tone, Mood and Imagery", "Characterization (Protagonist, Antagonist, Foil)"
        ]
    },
    "commerce": {
        "topics": [
            "Introduction to Commerce and Occupations", "Trade (Home and Foreign)", "Aids to Trade", 
            "Business Units and Finance", "Commercial Regulations and Legal Aspects"
        ],
        "subtopics": [
            "Division of Labour and Specialisation", "Retail and Wholesale Trade Channels", "Balance of Trade and Payments", 
            "Advertising, Banking and Insurance Role", "Sole Proprietorships, Partnerships and Corporations", 
            "Working Capital and Profit Calculations", "Consumer Protection and Business Law"
        ]
    },
    "geography": {
        "topics": [
            "Practical Geography and Map Work", "Physical Geography", "Human and Regional Geography", 
            "Introduction to Geographic Information Systems (GIS)"
        ],
        "subtopics": [
            "Map Scale, Bearing and Contours", "Earth's Crust and Volcanism", "Weather, Climate and Seasons", 
            "Population Growth, Distribution and Migration", "Urbanization and Settlement Patterns", 
            "Agriculture, Industry and Transport in Nigeria", "GIS Data Capture and Remote Sensing Basics"
        ]
    },
    "agriculture": {
        "topics": [
            "General Agriculture and Ecology", "Agronomy (Crop Production)", "Animal Science and Production", 
            "Agricultural Economics and Extension", "Agricultural Engineering and Technology"
        ],
        "subtopics": [
            "Land Tenure Systems in Nigeria", "Mendelian Genetics in Farming", "Soil Science and Plant Nutrition", 
            "Weed and Pest Control Methods", "Livestock Breeding and Health Management", 
            "Agricultural Marketing and Finance", "Farm Mechanization, Tools and Structures"
        ]
    },
    "civic": {
        "topics": [
            "National Values, Rights and Obligations", "Emerging Societal Issues", "Government Systems and Civic Processes"
        ],
        "subtopics": [
            "Citizenship Rights and Human Rights UDHR", "Drug Abuse, Cultism and Human Trafficking Dangers", 
            "National Unity and Civic Values", "Electoral Malpractice and Political Apathy", "Public Service and Anti-Corruption Policies"
        ]
    },
    "crs": {
        "topics": [
            "Old Testament (Creation to Exile)", "New Testament (Life and Ministry of Jesus)", "The Early Church and Paul's Mission"
        ],
        "subtopics": [
            "Creation and Abraham's Covenant", "Exodus and the Ten Commandments", "Leadership of Joshua and David", 
            "Prophecies of Amos and Hosea", "Birth, Baptism and Temptation of Jesus", "Sermon on the Mount and Parables", 
            "Miracles of Jesus", "Passion, Resurrection and Ascension", "Pentecost and the Early Christian Community", 
            "Paul's Conversion and Missionary Journeys"
        ]
    },
    "history": {
        "topics": [
            "Pre-colonial Nigeria", "European Contact and British Conquest", "Nationalist Movements and Independence", 
            "Post-Independence Nigeria and Foreign Relations"
        ],
        "subtopics": [
            "Nok, Ife and Benin Art Cultures", "Hausa States and Kanem-Borno Empire", "Oyo Empire and the Igbo Segmentary System", 
            "Trans-Atlantic Slave Trade and its Abolition", "British Annexation of Lagos and Amalgamation of 1914", 
            "Indirect Rule System and Colonial Resistance", "Herbert Macaulay and Early Nationalist Activities", 
            "The Richards and Macpherson Constitutions", "The Nigerian Civil War (1967-1970)", "Military Rule and Transition to Democracy"
        ]
    },
    "irs": {
        "topics": [
            "The Qur'an (Revelation and Compilation)", "Hadith (Study of Prophetic Sayings)", "Tawhid and Fiqh (Islamic Law)", 
            "Islamic History and Culture in West Africa"
        ],
        "subtopics": [
            "Revelation, Compilation and Preservation of Qur'an", "Surahs Al-Fatihah, Al-Nas, Al-Falaq, Al-Ikhlas", 
            "Authenticity and Classification of Hadith", "Hadith 1 to 10 of An-Nawawi", "Articles of Faith (Tawhid)", 
            "Pillars of Islam (Salat, Zakat, Sawm, Hajj)", "Shariah Law (Sources and Applications)", 
            "Family Law (Nikah, Talaq and Inheritance)", "Makkan and Madinan Phases of Prophet Muhammad's Life", 
            "The Rightly Guided Caliphs", "Spread of Islam in Nigeria and West Africa"
        ]
    },
    "further_mathematics": {
        "topics": [
            "Pure Mathematics", "Coordinate Geometry", "Trigonometry", "Calculus", "Vectors and Mechanics", "Statistics and Probability"
        ],
        "subtopics": [
            "Surds, Indices and Logarithms", "Sets and Binary Operations", "Binomial Theorem and Polynomials", 
            "Matrices and Determinants", "The Straight Line and Circle Equations", "Parabola, Ellipse and Hyperbola", 
            "Trigonometric Identities and Compound Angles", "Limits and Continuity of Functions", "Differentiation and its Applications", 
            "Integration Methods and Applications", "Vectors in 2D and 3D space", "Statics (Friction, Equilibrium and Moments)", 
            "Dynamics (Linear Motion, Projectiles and Newton's Laws)", "Permutations and Combinations", 
            "Probability and Probability Distributions"
        ]
    }
}

PROMPT_TEMPLATE = """
You are an expert question writer for competitive exam preparation. Your task is to generate a batch of multiple-choice questions (MCQs) for the subject: **{subject}**.
This is batch {batch_num} of {total_batches}.

Generate exactly {count} questions starting from ID: {start_id}.

---

### CURRICULUM CONTEXT
Topics list: {topics_list}
Subtopics list: {subtopics_list}

---

### OUTPUT FORMAT
Return a single valid JSON array of question objects (e.g. `[ {{ ... }}, {{ ... }} ]`). 
Do NOT wrap the output in markdown code fences (like ```json ... ```), no formatting prefix, no preamble, and no trailing text. Only raw JSON.

---

### QUESTION OBJECT SCHEMA
Every element in the array must be an object with ALL of the following fields:

{{
  "id": "{id_prefix}_[zero-padded 4-digit number]",
  "year": [integer between 2017 and 2023],
  "topic": "[Must match one entry in the Topics list exactly]",
  "subtopic": "[Must match one entry in the Subtopics list exactly]",
  "question_text": "[Full question stem. Use \\( \\) for inline LaTeX and \\[ \\] for display LaTeX. Reference the diagram with 'In the diagram below, ...' when has_diagram is true.]",
  "question_type": "mcq",
  "has_diagram": [boolean],
  "diagram_svg": [SVG string if has_diagram is true, else null],
  "latex": [raw LaTeX formula if the question contains a primary equation/math expression, else null],
  "options": [
    {{ "id": "A", "text": "[option]" }},
    {{ "id": "B", "text": "[option]" }},
    {{ "id": "C", "text": "[option]" }},
    {{ "id": "D", "text": "[option]" }}
  ],
  "correct_option": "[A, B, C, or D]",
  "explanation": "[Step-by-step explanation. Show all calculations using LaTeX. Explain the underlying principle and eliminate each distractor.]",
  "difficulty": [integer 1-5, where 1=Very Easy, 2=Easy, 3=Medium, 4=Hard, 5=Very Hard]
}}

---

### CRITICAL RULES
1. **Difficulty**: All questions must be "above average" or "average" difficulty (difficulty ratings of 3, 4, or 5).
2. **LaTeX**: All formulas, equations, matrices, or mathematical symbols must use KaTeX-compatible LaTeX wrapped in \\( \\) for inline or \\[ \\] for display. Use double backslashes.
3. **Diagrams**: At least 15-20% of the questions in this batch should have `has_diagram` set to true, containing a valid inline SVG with viewBox='0 0 320 200' and xmlns='http://www.w3.org/2000/svg'.
4. **Variety**: Ensure all questions are unique. {exclude_text}
"""

def call_do_inference(prompt, model_name):
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are a precise JSON generator. You output only raw, valid JSON arrays without markdown styling."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }
    
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)
            return res_json["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        raise e
    except Exception as e:
        print(f"Error during API call: {e}")
        raise e

def clean_json_content(content):
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()
    
    # 1. Escape single backslashes followed by common LaTeX commands that conflict with JSON escapes (t, f, b)
    overlap_commands = ["text", "frac", "beta", "theta", "times"]
    for cmd in overlap_commands:
        content = re.sub(r'(?<!\\)\\' + cmd, r'\\\\' + cmd, content)
        
    # 2. Escape single backslashes before delimiters \( \) \[ \] and whitespace
    content = re.sub(r'(?<!\\)\\(?=[()[\]\s])', r'\\\\', content)
    
    # 3. Escape any other backslash that is not followed by a valid JSON escape sequence (", \, /, b, f, n, r, t, u)
    content = re.sub(r'(?<!\\)\\(?!["\\/bfnrtu])', r'\\\\', content)
    
    return content

def load_existing_questions(output_file):
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("questions", [])
        except Exception as e:
            print(f"Warning: Could not read existing file {output_file} (error: {e}). Starting fresh.")
    return []

def save_progress(output_file, subject, questions):
    data = {
        "subject": subject,
        "description": f"JAMB UTME {subject.capitalize()} questions",
        "total": len(questions),
        "schema_version": "1.0",
        "questions": questions
    }
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def crosscheck_questions(subject, output_file, premium_model, delay):
    print(f"\n--- Starting Premium Crosscheck and Quality Audit for {subject.capitalize()} ---")
    questions = load_existing_questions(output_file)
    if not questions:
        print("No questions found to crosscheck.")
        return
        
    print(f"Loaded {len(questions)} questions. Auditing in batches of 10 using {premium_model}...")
    
    audited_questions = []
    batch_size = 10
    total_batches = (len(questions) + batch_size - 1) // batch_size
    
    for i in range(0, len(questions), batch_size):
        batch_idx = (i // batch_size) + 1
        current_batch = questions[i:i+batch_size]
        print(f"Auditing batch {batch_idx}/{total_batches}...")
        
        audit_prompt = f"""
You are a premium curriculum auditor. Review these {len(current_batch)} Multiple Choice Questions (MCQs) for the subject **{subject.capitalize()}**.
Perform the following checks:
1. **Deduplication:** Ensure there are no identical or near-identical questions in this batch. If found, significantly modify one of them to test a different subtopic.
2. **LaTeX Validation:** Ensure all formulas/equations use correct, KaTeX-compliant formatting. (E.g. double backslashes inside JSON strings like \\\\( \\\\text{{H}}_2\\\\text{{O}} \\\\) or Display equations wrapped in \\\\[ and \\\\]).
3. **SVG Validation:** Ensure any inline SVG code is valid, clean, and uses font-family='Inter,sans-serif' with correct coordinate positions.
4. **Accuracy Check:** Verify that the correct option is indeed correct, and that the explanation step-by-step calculations match the answer.

Output a single valid JSON array of these {len(current_batch)} audited, corrected question objects. Do not write markdown fences, preamble, or notes.
Here is the batch to audit:
{json.dumps(current_batch, indent=2)}
"""
        retries = 3
        while retries > 0:
            try:
                raw_response = call_do_inference(audit_prompt, premium_model)
                cleaned_response = clean_json_content(raw_response)
                corrected_batch = json.loads(cleaned_response, strict=False)
                
                if isinstance(corrected_batch, list) and len(corrected_batch) == len(current_batch):
                    audited_questions.extend(corrected_batch)
                    # Instantly save audited progress
                    save_progress(output_file, subject, audited_questions + questions[i+batch_size:])
                    print(f"Batch {batch_idx} audited successfully.")
                    break
                else:
                    print(f"Error: Expected an array of length {len(current_batch)}. Got different size. Retrying...")
            except Exception as e:
                print(f"Audit of batch {batch_idx} failed (error: {e}). Retrying in 5 seconds...")
                time.sleep(5)
            retries -= 1
            
        if retries == 0:
            print("Failed to audit batch. Keeping original data for this batch to avoid stopping.")
            audited_questions.extend(current_batch)
            
        time.sleep(delay)
        
    print(f"\nAudit complete! All verified questions written to {output_file}")

def main():
    parser = argparse.ArgumentParser(description="Hybrid Model Question Generator and Auditor for DigitalOcean Inference API")
    parser.add_argument("--subject", type=str, choices=list(CURRICULUMS.keys()), help="The subject to generate questions for")
    parser.add_argument("--count", type=int, default=2000, help="Total number of questions to generate")
    parser.add_argument("--batch-size", type=int, default=5, help="Number of questions per API call")
    parser.add_argument("--crosscheck", action="store_true", help="Run the premium post-processing audit and deduplication")
    parser.add_argument("--premium-model", type=str, default=DEFAULT_PREMIUM_MODEL, help="Change the premium auditor model")
    parser.add_argument("--delay", type=float, default=5.0, help="Delay in seconds between API calls to prevent rate limits")
    args = parser.parse_args()

    if not args.subject:
        print("Error: Please specify a subject using --subject. Available subjects:")
        for s in CURRICULUMS.keys():
            print(f" - {s}")
        return

    if API_KEY == "YOUR_DO_INFERENCE_KEY_HERE":
        print("Please replace YOUR_DO_INFERENCE_KEY_HERE with your actual DigitalOcean Inference API Key.")
        return

    subject = args.subject
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, f"{subject}_questions.json")

    # If crosscheck only
    if args.crosscheck:
        crosscheck_questions(subject, output_file, args.premium_model, args.delay)
        return

    # Select the model matched to this subject
    generator_model = SUBJECT_MODELS.get(subject, "meta-llama-3-70b-instruct")
    print(f"Routing to subject model: '{generator_model}' for subject: '{subject.capitalize()}'")

    total_questions = args.count
    batch_size = args.batch_size
    curriculum = CURRICULUMS[subject]
    
    # Load existing questions for resume capabilities
    all_questions = load_existing_questions(output_file)
    already_generated = len(all_questions)
    
    if already_generated >= total_questions:
        print(f"Already generated {already_generated}/{total_questions} questions for {subject.capitalize()}.")
        print("Run with --crosscheck to trigger the premium audit pass.")
        return
        
    if already_generated > 0:
        print(f"Resuming generation. Found {already_generated} existing questions.")

    total_batches = total_questions // batch_size
    id_prefix = subject[:3].lower()

    # Calculate starting batch index
    start_batch_idx = already_generated // batch_size

    for i in range(start_batch_idx, total_batches):
        batch_num = i + 1
        start_idx = i * batch_size + 1
        start_id = f"{id_prefix}_{start_idx:04d}"
        
        # Build the anti-repetition constraint list from the last 30 question texts
        exclude_text = ""
        if all_questions:
            recent_stems = [q.get("question_text", "")[:120] for q in all_questions[-30:]]
            exclude_text = "\nDO NOT repeat or generate questions similar to these topics:\n" + "\n".join(f"- {stem}..." for stem in recent_stems)

        print(f"\nGenerating batch {batch_num}/{total_batches} (starting at {start_id})...")
        
        prompt = PROMPT_TEMPLATE.format(
            subject=subject.capitalize(),
            batch_num=batch_num,
            total_batches=total_batches,
            count=batch_size,
            start_id=start_id,
            id_prefix=id_prefix,
            topics_list=json.dumps(curriculum["topics"]),
            subtopics_list=json.dumps(curriculum["subtopics"]),
            exclude_text=exclude_text
        )
        
        retries = 3
        while retries > 0:
            try:
                raw_response = call_do_inference(prompt, generator_model)
                cleaned_response = clean_json_content(raw_response)
                questions_batch = json.loads(cleaned_response, strict=False)
                
                if isinstance(questions_batch, list):
                    all_questions.extend(questions_batch)
                    save_progress(output_file, subject, all_questions)
                    print(f"Successfully generated batch {batch_num}. Saved progress. Total questions: {len(all_questions)}")
                    break
                else:
                    print("Error: Expected a list of questions, got something else. Retrying...")
            except Exception as e:
                print(f"Batch {batch_num} failed (error: {e}). Retrying in 5 seconds...")
                time.sleep(5)
            retries -= 1
        
        if retries == 0:
            print("Failed to generate batch after multiple retries. Exiting.")
            break
            
        time.sleep(args.delay)

    print(f"\nCompleted Generation! Total of {len(all_questions)} questions saved to {output_file}")
    print(f"Next step: Run 'python generate_questions.py --subject {subject} --crosscheck' to trigger the premium validator.")

if __name__ == "__main__":
    main()
