const axios = require('axios').default;
const { ForbiddenException } = require('@nestjs/common');
const schema = require('../dist/db/schema');
const { ExplanationCacheService } = require('../dist/ai/explanation-cache.service');
const { AiKeyManagerService } = require('../dist/ai/ai-key-manager.service');
const { AiService } = require('../dist/ai/ai.service');
const {
  buildStandardExplanationMessages,
  hashQuestionContent,
  normalizeExplanationField,
  singleFlight,
  validateExplanationOutput,
} = require('../dist/ai/explanation-cache.utils');

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));

const validText = `### Correct answer\nB is correct because it follows the stated principle.\n\n### Why the other options are wrong\nA is inconsistent with the definition.\nC does not follow from the data.\nD uses the wrong relationship.\n\n### Key takeaway\nCheck the governing principle before choosing.`;
const fallback = 'AI explanations are temporarily unavailable. Please try again shortly.';

function makeQuestion(patch = {}) {
  return {
    id: 'q-1', subject: 'Physics', question_text: '  What is force?  ',
    options: [{ id: 'A', text: 'Mass' }, { id: 'B', text: 'Mass times acceleration' }, { id: 'C', text: 'Energy' }, { id: 'D', text: 'Power' }],
    correct_option: 'B', media: [], has_diagram: false, diagram_svg: null, latex: null,
    status: 'published', ...patch,
  };
}

class FakeDb {
  constructor() {
    this.cacheRows = [];
    this.history = [];
    this.reports = [];
    this.callLogs = [];
    this.events = [];
    this.counterSequence = [];
    this.executeIndex = 0;
    this.failNextTransaction = false;
    this.promptVersion = 'expl-v1';
  }
  select() {
    return { from: (table) => ({ where: () => ({ limit: async () => table === schema.questionExplanations ? this.cacheRows.filter((row) => row.promptVersion === this.promptVersion).slice(0, 1) : [] }) }) };
  }
  transaction(callback) {
    if (this.failNextTransaction) { this.failNextTransaction = false; return Promise.reject(new Error('connection lost')); }
    this.executeIndex = 0;
    return callback(this);
  }
  async execute(query) {
    const text = (query?.queryChunks || []).map((chunk) => chunk?.value?.join?.('') || '').join('');
    if (text.includes('set_config') || text.includes('pg_advisory_xact_lock')) return [];
    const next = this.counterSequence.length ? this.counterSequence.shift() : 1;
    return next === 0 ? [] : [{ count: next }];
  }
  update(table) {
    let fields;
    return { set: (value) => { fields = value; return { where: () => {
      const apply = () => {
        if (table !== schema.questionExplanations || !this.cacheRows.length) return [];
        const row = this.cacheRows[0];
        for (const [key, fieldValue] of Object.entries(fields)) {
          if (key === 'hitCount' || key === 'reportCount') row[key] = Number(row[key] || 0) + 1;
          else row[key] = fieldValue;
        }
        return [{ reportCount: row.reportCount }];
      };
      return { returning: async () => apply(), then: (resolve, reject) => Promise.resolve().then(apply).then(resolve, reject) };
    } }; } };
  }
  insert(table) {
    return { values: (value) => {
      const apply = () => {
        if (table === schema.questionExplanationHistory) this.history.push({ ...value });
        if (table === schema.aiCallLogs) this.callLogs.push({ ...value });
        if (table === schema.questionExplanationEvents) this.events.push({ ...value });
        if (table === schema.questionExplanations) {
          const current = this.cacheRows.find((row) => row.questionId === value.questionId && row.promptVersion === value.promptVersion);
          if (current) Object.assign(current, value);
          else this.cacheRows.push({ ...value });
        }
      };
      const chain = {
        onConflictDoUpdate: (config) => {
          const current = this.cacheRows.find((row) => row.questionId === value.questionId && row.promptVersion === value.promptVersion);
          if (current) Object.assign(current, value, config.set);
          else this.cacheRows.push({ ...value });
          return Promise.resolve();
        },
        onConflictDoNothing: () => ({ returning: async () => {
          const duplicate = this.reports.some((row) => row.explanationId === value.explanationId && row.reporterHash === value.reporterHash);
          if (duplicate) return [];
          this.reports.push({ ...value });
          return [{ id: value.id }];
        } }),
        then: (resolve, reject) => Promise.resolve().then(() => { apply(); return undefined; }).then(resolve, reject),
      };
      return chain;
    } };
  }
}

function makeConfig(overrides = {}) {
  const values = {
    CBT_EXPLANATION_CACHE_ENABLED: 'true', PROMPT_VERSION: 'expl-v1',
    CBT_USER_PER_MINUTE_LIMIT: '3', CBT_USER_DAILY_AI_LIMIT: '20',
    CBT_GLOBAL_DAILY_AI_CAP: '100', REPORT_FLAG_THRESHOLD: '3',
    CBT_REPORT_HASH_SECRET: 'test-only-report-key', CBT_USER_DAILY_EXPLANATION_REPORT_LIMIT: '5',
    CBT_CACHE_LOCK_TIMEOUT_MS: '30000', ...overrides,
  };
  return { get: (key, fallbackValue) => values[key] ?? fallbackValue };
}

function makeService(db = new FakeDb(), overrides = {}) {
  const config = makeConfig(overrides);
  return { service: new ExplanationCacheService(db, config), db, config };
}

function generator(text = validText) {
  const fn = jest.fn(async () => ({ text, modelUsed: 'mock-model', keyAlias: 'mock-key-1', inputTokens: 30, outputTokens: 60 }));
  return fn;
}

beforeEach(() => axios.post.mockReset());

describe('AI explanation cache utilities', () => {
  test('normalizes trivial whitespace and hashes ordered canonical question content', () => {
    expect(normalizeExplanationField('  A\r\n\t B  ')).toBe('A\nB');
    expect(hashQuestionContent(makeQuestion())).toBe(hashQuestionContent(makeQuestion({ question_text: 'What is force?' })));
    expect(hashQuestionContent(makeQuestion())).not.toBe(hashQuestionContent(makeQuestion({ correct_option: 'A' })));
    expect(hashQuestionContent(makeQuestion())).not.toBe(hashQuestionContent(makeQuestion({ options: [...makeQuestion().options].reverse() })));
  });

  test('creates a neutral prompt with no student-specific fields or selected answer', () => {
    const prompt = JSON.stringify(buildStandardExplanationMessages(makeQuestion()));
    expect(prompt).toContain('### Why the other options are wrong');
    expect(prompt).not.toMatch(/studentAnswer|student's selected answer|Falcon|user-123|school-123|score-999/i);
    expect(prompt).not.toContain('Falcon');
  });

  test('accepts required explanation sections and rejects malformed/refusal outputs', () => {
    expect(validateExplanationOutput(validText).valid).toBe(true);
    expect(validateExplanationOutput('')).toMatchObject({ valid: false });
    expect(validateExplanationOutput('I cannot provide an explanation. '.repeat(5)).valid).toBe(false);
    expect(validateExplanationOutput('A'.repeat(13000)).valid).toBe(false);
    expect(validateExplanationOutput(`${validText} ${'word '.repeat(351)}`)).toMatchObject({ valid: false, reason: 'too_many_words' });
  });

  test('single-flight shares one provider promise across 50 simultaneous callers', async () => {
    const inflight = new Map();
    let calls = 0;
    const work = () => singleFlight(inflight, 'q-1:expl-v1', async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'ready';
    });
    const results = await Promise.all(Array.from({ length: 50 }, work));
    expect(calls).toBe(1);
    expect(results).toEqual(Array(50).fill('ready'));
    expect(inflight.size).toBe(0);
  });

  test('single-flight entry clears after a rejected generation so a later request retries', async () => {
    const inflight = new Map();
    await expect(singleFlight(inflight, 'q-1:expl-v1', async () => { throw new Error('fail'); })).rejects.toThrow('fail');
    await new Promise((resolve) => setImmediate(resolve));
    expect(await singleFlight(inflight, 'q-1:expl-v1', async () => 'retry')).toBe('retry');
  });
});

describe('ExplanationCacheService', () => {
  test('cache miss generates once, stores the result, and exposes it on the next request without another AI call', async () => {
    const { service, db } = makeService();
    const generate = generator();
    const first = await service.explain({ userId: 'student-1', question: makeQuestion(), remaining: 20, generate });
    const second = await service.explain({ userId: 'student-2', question: makeQuestion(), remaining: 20, generate });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(first.explanation).toBe(validText);
    expect(first.reportable).toBe(true);
    expect(second).toMatchObject({ explanation: validText, cached: true });
    expect(second.reportable).toBe(true);
    expect(db.cacheRows).toHaveLength(1);
    expect(db.cacheRows[0].hitCount).toBe(1);
  });

  test('edited question content archives the stale row and lazily regenerates', async () => {
    const { service, db } = makeService();
    const generate = generator();
    await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate });
    const revised = makeQuestion({ question_text: 'What is the net force?' });
    const next = await service.explain({ userId: 'u1', question: revised, remaining: 19, generate });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(next.explanation).toBe(validText);
    expect(db.history).toHaveLength(1);
    expect(db.history[0].status).toBe('superseded');
  });

  test('a request arriving during an older-revision generation never receives stale text', async () => {
    const { service } = makeService();
    let finishFirst;
    const oldText = validText.replace('B is correct because it follows the stated principle.', 'B is correct for the original question.');
    const newText = validText.replace('B is correct because it follows the stated principle.', 'B is correct for the revised question.');
    const generate = jest.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = () => resolve({ text: oldText, modelUsed: 'mock' }); }))
      .mockResolvedValueOnce({ text: newText, modelUsed: 'mock' });
    const firstRequest = service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate });
    while (!finishFirst) await new Promise((resolve) => setImmediate(resolve));
    const revisedRequest = service.explain({ userId: 'u2', question: makeQuestion({ question_text: 'Revised force question?' }), remaining: 20, generate });
    finishFirst();
    const [first, revised] = await Promise.all([firstRequest, revisedRequest]);
    expect(first.explanation).toBe(oldText);
    expect(revised.explanation).toBe(newText);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  test('prompt version bump causes lazy regeneration in a separate version slot', async () => {
    const db = new FakeDb();
    const config = makeConfig();
    const service = new ExplanationCacheService(db, config);
    const generate = generator();
    await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate });
    config.get = (key, fallbackValue) => key === 'PROMPT_VERSION' ? 'expl-v2' : ({ CBT_EXPLANATION_CACHE_ENABLED: 'true', CBT_USER_PER_MINUTE_LIMIT: '3', CBT_USER_DAILY_AI_LIMIT: '20', CBT_GLOBAL_DAILY_AI_CAP: '100', REPORT_FLAG_THRESHOLD: '3', CBT_REPORT_HASH_SECRET: 'test-only-report-key' }[key] ?? fallbackValue);
    db.promptVersion = 'expl-v2';
    const next = await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 19, generate });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(next.cached).toBe(false);
    expect(db.cacheRows.map((row) => row.promptVersion)).toEqual(['expl-v1', 'expl-v2']);
  });

  test('50 simultaneous cache misses for the same question invoke the provider once', async () => {
    const { service } = makeService();
    const generate = generator();
    const results = await Promise.all(Array.from({ length: 50 }, (_, i) => service.explain({ userId: `u${i}`, question: makeQuestion(), remaining: 20, generate })));
    expect(generate).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(50);
    expect(results.every((result) => result.explanation === validText)).toBe(true);
  });

  test('failed database lock attempt is released and later request can retry', async () => {
    const { service, db } = makeService();
    db.failNextTransaction = true;
    const generate = generator();
    expect((await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate })).explanation).toBe(fallback);
    expect((await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate })).explanation).toBe(validText);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  test('provider failure and invalid output are not cached; subsequent requests can retry', async () => {
    const { service, db } = makeService();
    const failing = jest.fn().mockRejectedValueOnce(new Error('mock-provider-down')).mockResolvedValueOnce({ text: 'I cannot help with this.', modelUsed: 'mock' });
    expect((await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate: failing })).explanation).toBe(fallback);
    expect(db.cacheRows).toHaveLength(0);
    expect((await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate: failing })).explanation).toBe(fallback);
    expect(db.cacheRows).toHaveLength(0);
  });

  test('upstream wallet-insufficient HTTP errors propagate and are not cached as generic provider failures', async () => {
    const { service, db } = makeService();
    const denied = new ForbiddenException({ code: 'OUT_OF_COINS', message: 'You have used all coins.' });
    await expect(service.explain({ userId: 'u1', question: makeQuestion(), remaining: null, generate: async () => { throw denied; } })).rejects.toBe(denied);
    expect(db.cacheRows).toHaveLength(0);
  });

  test('minute and daily limits return friendly explanations without invoking the provider', async () => {
    const minuteDb = new FakeDb(); minuteDb.counterSequence = [0];
    const minute = makeService(minuteDb).service;
    const provider = generator();
    expect((await minute.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate: provider })).explanation).toMatch(/wait a minute/i);
    const dayDb = new FakeDb(); dayDb.counterSequence = [1, 0];
    const day = makeService(dayDb).service;
    expect((await day.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate: provider })).explanation).toMatch(/used today's AI help/i);
    expect(provider).not.toHaveBeenCalled();
  });

  test('global cap blocks new generations but does not block a populated cache hit', async () => {
    const db = new FakeDb();
    const service = makeService(db, { CBT_GLOBAL_DAILY_AI_CAP: '0' }).service;
    const generate = generator();
    expect((await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate })).explanation).toMatch(/resting, back tomorrow/i);
    expect(generate).not.toHaveBeenCalled();
    db.cacheRows.push({ id: 'c1', questionId: 'q-1', contentHash: hashQuestionContent(makeQuestion()), promptVersion: 'expl-v1', explanationText: validText, modelUsed: 'mock', status: 'active', hitCount: 0, reportCount: 0 });
    expect((await service.explain({ userId: 'u1', question: makeQuestion(), remaining: 20, generate })).explanation).toBe(validText);
    expect(generate).not.toHaveBeenCalled();
  });

  test('global cap returns the friendly resting message for live AI requests', async () => {
    const service = makeService(new FakeDb(), { CBT_GLOBAL_DAILY_AI_CAP: '0' }).service;
    await expect(service.enforceLiveLimits('u1')).rejects.toThrow(/resting, back tomorrow/i);
  });

  test('three distinct reports flag an explanation and the next request regenerates it', async () => {
    const { service, db } = makeService();
    const freshText = validText.replace('B is correct because it follows the stated principle.', 'B is correct because it follows the updated answer key.');
    const generate = jest.fn()
      .mockResolvedValueOnce({ text: validText, modelUsed: 'mock-model' })
      .mockResolvedValueOnce({ text: freshText, modelUsed: 'mock-model' });
    await service.explain({ userId: 'seed', question: makeQuestion(), remaining: 20, generate });
    const firstRow = db.cacheRows[0];
    const reporterA = await service.report({ userId: 'student-a', questionId: 'q-1', reason: 'unclear' });
    const reporterB = await service.report({ userId: 'student-b', questionId: 'q-1', reason: 'check an option' });
    const reporterC = await service.report({ userId: 'student-c', questionId: 'q-1' });
    expect(reporterA.reported && reporterB.reported && reporterC.flagged).toBe(true);
    expect(firstRow.status).toBe('flagged');
    expect(db.reports.every((row) => !Object.prototype.hasOwnProperty.call(row, 'userId'))).toBe(true);
    const refreshed = await service.explain({ userId: 'student-d', question: makeQuestion(), remaining: 20, generate });
    expect(refreshed.cached).toBe(false);
    expect(refreshed.explanation).toBe(freshText);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(db.history.some((row) => row.status === 'flagged')).toBe(true);
  });
});

describe('AI provider key rotation', () => {
  test('durable per-key caps accept postgres-js array results and reject an exhausted alias', async () => {
    const db = { execute: jest.fn().mockResolvedValueOnce([{ count: 1 }]).mockResolvedValueOnce([]) };
    const manager = new AiKeyManagerService(db, { get: (key) => key === 'PER_KEY_DAILY_CAP' ? '1' : undefined });
    expect(await manager.reserveDailyKeyUse('mistral-primary')).toBe(true);
    expect(await manager.reserveDailyKeyUse('mistral-primary')).toBe(false);
  });

  test('a simulated 429 on key alias 1 rotates to key 2 without exposing key material in logs', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 429 } }).mockResolvedValueOnce({ data: { model: 'mistral-small-latest', choices: [{ message: { content: validText } }], usage: { prompt_tokens: 21, completion_tokens: 34 } } });
    const manager = {
      getMistralKeys: () => [{ alias: 'key-one', key: 'mock-secret-one' }, { alias: 'key-two', key: 'mock-secret-two' }],
      reserveDailyKeyUse: jest.fn().mockResolvedValue(true),
    };
    const service = new AiService({}, {}, {}, {}, { get: () => undefined }, {}, manager);
    const completion = await service.callMistralApiWithMetadata([], 200, 'explanation', 'q-1', false);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[0][2].headers.Authorization).toBe('Bearer mock-secret-one');
    expect(axios.post.mock.calls[1][2].headers.Authorization).toBe('Bearer mock-secret-two');
    expect(completion.keyAlias).toBe('key-two');
    expect(completion.inputTokens).toBe(21);
    expect(completion.outputTokens).toBe(34);
  });

  test('a transient 503 retries the same key with bounded retry configuration', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 503 } }).mockResolvedValueOnce({ data: { model: 'mistral-small-latest', choices: [{ message: { content: validText } }], usage: {} } });
    const manager = { getMistralKeys: () => [{ alias: 'key-one', key: 'mock-secret-one' }], reserveDailyKeyUse: jest.fn().mockResolvedValue(true) };
    const config = { get: (key) => ({ AI_PROVIDER_RETRIES: '1', AI_RETRY_BASE_MS: '1', AI_PROVIDER_TIMEOUT_MS: '1000' }[key]) };
    const service = new AiService({}, {}, {}, {}, config, {}, manager);
    const completion = await service.callMistralApiWithMetadata([], 200, 'explanation', 'q-1', false);
    expect(completion.text).toBe(validText);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[0][2].headers.Authorization).toBe(axios.post.mock.calls[1][2].headers.Authorization);
  });
});
