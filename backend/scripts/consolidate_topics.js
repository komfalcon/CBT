const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
const postgres = require('postgres');

const dbUrl = process.env.DATABASE_URL || 'postgresql://falcon:Korex1025%24@cbtaurikex-db.postgres.database.azure.com:5432/postgres?sslmode=require';
const sql = postgres(dbUrl, { ssl: 'require' });

const physicsRules = [
  {
    canonical: 'Atomic, Quantum & Nuclear Physics',
    patterns: [
      'Atomic Quantum Physics',
      'Atomic & Nuclear Physics',
      'Atomic Physics',
      'Atomic, Quantum & Nuclear Physics%',
      'Atomic & Quantum Physics%',
      'Nuclear Physics%',
      'Quantum & Atomic Physics',
      'Quantum & Nuclear Physics',
      'Modern Physics%',
    ],
  },
  {
    canonical: 'Circuits & Magnetism',
    patterns: [
      'Circuits and Magnetism',
      'Circuits & Magnetism',
      'Electric Fields',
      'Electricity%',
      'Magnetism%',
    ],
  },
  {
    canonical: "Mechanics, Motion & Newton's Laws",
    patterns: [
      'Mechanics%',
      'Motion & Newton%',
      'Motion and Newton%',
      'Newton Laws',
      "Newton's Laws%",
      'Newton’s Laws%',
    ],
  },
  {
    canonical: 'Fluids, Viscosity & Surface Tension',
    patterns: [
      'Fluids%',
      'Surface Tension%',
      'Viscosity & Surface Tension',
    ],
  },
  {
    canonical: 'Gas Laws, Heat & Thermodynamics',
    patterns: [
      'Gas Laws%',
      'Thermal Physics',
      'Thermodynamics%',
    ],
  },
  {
    canonical: 'Gravitational & Electric Fields',
    patterns: [
      'Gravitational%',
    ],
  },
  {
    canonical: 'Simple Harmonic Motion & Elasticity',
    patterns: [
      'Elasticity%',
      'Simple Harmonic Motion%',
    ],
  },
  {
    canonical: 'Waves, Sound & Wave Optics',
    patterns: [
      'Optics',
      'Sound%',
      'Wave Optics%',
      'Waves%',
    ],
  },
];

async function runConsolidation() {
  console.log('Starting Database Topic Consolidations...');

  for (const rule of physicsRules) {
    for (const pattern of rule.patterns) {
      if (pattern.endsWith('%')) {
        const prefix = pattern.slice(0, -1);
        const res = await sql`
          UPDATE questions
          SET topic = ${rule.canonical}
          WHERE LOWER(subject) = 'physics'
            AND (topic LIKE ${prefix + '%'} OR LOWER(topic) LIKE ${prefix.toLowerCase() + '%'});
        `;
        console.log(`[Physics] Mapped pattern '${pattern}' -> '${rule.canonical}' (${res.count} updated)`);
      } else {
        const res = await sql`
          UPDATE questions
          SET topic = ${rule.canonical}
          WHERE LOWER(subject) = 'physics'
            AND (LOWER(topic) = ${pattern.toLowerCase()});
        `;
        console.log(`[Physics] Mapped exact '${pattern}' -> '${rule.canonical}' (${res.count} updated)`);
      }
    }
  }

  const suffixRes = await sql`
    UPDATE questions
    SET topic = REGEXP_REPLACE(topic, '\\s*\\((Scenario|Passage|Advanced|Forces|Special|Vector|with|with Diagram)[^)]*\\)', '', 'gi')
    WHERE topic ~* '\\((Scenario|Passage|Advanced|Forces|Special|Vector|with|with Diagram)';
  `;
  console.log(`Cleaned scenario/passage parentheses suffixes across all subjects (${suffixRes.count} updated)`);

  await sql`UPDATE questions SET topic = TRIM(topic);`;

  console.log('\n--- Top Topics Count Per Subject After Consolidation ---');
  const summary = await sql`
    SELECT subject, topic, COUNT(*)::int as count
    FROM questions
    GROUP BY subject, topic
    HAVING COUNT(*) > 0
    ORDER BY subject ASC, count DESC;
  `;

  const grouped = {};
  for (const row of summary) {
    if (!grouped[row.subject]) grouped[row.subject] = [];
    grouped[row.subject].push({ topic: row.topic, count: row.count });
  }

  for (const [subject, topics] of Object.entries(grouped)) {
    console.log(`\n=== Subject: ${subject.toUpperCase()} (${topics.length} distinct topics) ===`);
    topics.slice(0, 15).forEach((t) => console.log(`  - ${t.topic}: ${t.count} questions`));
    if (topics.length > 15) {
      console.log(`  ... and ${topics.length - 15} more topics.`);
    }
  }

  console.log('\nTopic consolidation completed successfully!');
  await sql.end();
  process.exit(0);
}

runConsolidation().catch((err) => {
  console.error('Error consolidating topics:', err);
  process.exit(1);
});
