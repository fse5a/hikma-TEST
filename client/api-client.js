(() => {
  const DEFAULT_TIMEOUT_MS = 12000;

  function isDemoNotConfigured(payload) {
    const message = String(payload?.error?.message || '').toLowerCase();
    const code = String(payload?.error?.code || '').toLowerCase();
    return code.includes('not_configured') || code.includes('not-configured') || message.includes('not configured') || message.includes('not set up') || message.includes('not available');
  }

  function toFriendlyMessage(error) {
    const message = error && error.message ? String(error.message) : '';
    const lower = message.toLowerCase();
    if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('timeout') || lower.includes('abort')) {
      return 'تعذر الاتصال بالخادم. يمكنك متابعة القراءة المحلية من شاشة التفعيل.';
    }
    if (isDemoNotConfigured({error: {message}})) {
      return 'الخدمة غير مهيأة. لم يتم التفعيل؛ تحقق من إعداد الخادم أو اختر المتابعة المحلية.';
    }
    if (lower.includes('missing') || lower.includes('invalid')) {
      return 'البيانات غير مكتملة أو غير صالحة. جرّب مرة أخرى.';
    }
    if (lower.includes('not allowed') || lower.includes('forbidden')) {
      return 'هذا الإجراء غير مسموح به في هذه النُسخة.';
    }
    return 'حدثت مشكلة أثناء الاتصال. جرّب مرة أخرى، أو استخدم الوضع التجريبي.';
  }

  function demoResponseFor(path, details = {}) {
    const url = String(path || '');
    if (url.includes('/api/health')) {
      return {
        ok: true,
        mode: 'demo',
        integrationStatus: 'demo-mode',
        requestId: 'demo-request',
        warnings: ['Backend is not configured; demo mode is active.'],
        ...details
      };
    }
    if (url.includes('/api/activate')) {
      return {
        ok: true,
        mode: 'demo',
        requestId: 'demo-request',
        message: 'تم قبول التفعيل في الوضع التجريبي.',
        activation: {status: 'demo'}
      };
    }
    if (url.includes('/api/translate') || url.includes('/api/diacritize')) {
      return {
        ok: true,
        mode: 'demo',
        requestId: 'demo-request',
        text: details.text || '',
        translatedText: details.text || '',
        note: 'تم استخدام الوضع التجريبي المحلي.'
      };
    }
    if (url.includes('/api/speech')) {
      return {
        ok: true,
        mode: 'demo',
        provider: 'device',
        audioUrl: null,
        requestId: 'demo-request',
        note: 'يُستخدم صوت الجهاز بشكل مجاني.'
      };
    }
    if (url.includes('/api/import/url')) {
      return {
        ok: true,
        mode: 'demo',
        requestId: 'demo-request',
        preview: {title: '', language: 'unknown', text: '', paragraphs: 0, wordCount: 0, firstLines: [], needsClientRender: true},
        note: 'الصق النص أو استخدم علامة Hikma المرجعية؛ لا يمكن الوصول إلى API من هذا العرض المحلي.'
      };
    }
    return {
      ok: true,
      mode: 'demo',
      requestId: 'demo-request',
      ...details
    };
  }

  async function request(path, options = {}) {
    const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
    const {timeoutMs: _timeout, ...fetchOptions} = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const authorization = await authorizationHeader(path);
      const response = await fetch(path, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.body && !Object.keys(options.headers || {}).some(key => key.toLowerCase() === 'content-type') ? {'Content-Type': 'application/json'} : {}),
          ...(authorization ? {Authorization: authorization} : {}),
          ...(options.headers || {})
        }
      });
      const payload = await response.json().catch(() => ({}));

      if (isDemoNotConfigured(payload) || response.status === 503) {
        if (isHealthPath(path)) throw apiError('الخدمة الخلفية غير مهيأة، ولم يؤكد الخادم وضعًا تجريبيًا.', 'not_configured');
        let health;
        try {
          health = await request('/api/health', {}, true);
        } catch {
          throw apiError('تعذر التحقق من وضع الخادم. لم يتم التفعيل أو استخدام رد تجريبي.', 'health_unavailable');
        }
        if (health.mode === 'demo') return demoResponseFor(path, payload);
        throw apiError('الخدمة غير مهيأة في هذا الخادم. لم يتم التفعيل؛ راجع إعدادات الخدمة.', 'not_configured');
      }

      if (response.ok) {
        return payload;
      }

      const error = apiError(payload?.error?.message || `HTTP ${response.status}`, payload?.error?.code || `http_${response.status}`);
      error.status = response.status;
      throw error;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw apiError('انتهت مهلة الاتصال بالخادم. تحقق من اتصالك ثم حاول مجددًا.', 'timeout');
      }
      if (error.code) throw error;
      if (error instanceof TypeError) throw apiError(toFriendlyMessage(error), 'network_error');
      throw new Error(toFriendlyMessage(error));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function apiError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function isHealthPath(path) {
    return new URL(String(path), globalThis.location?.href || 'http://localhost').pathname.endsWith('/api/health');
  }

  function sessionStorageSafe() {
    try { return globalThis.sessionStorage || null; } catch { return null; }
  }

  function isAuthExempt(path) {
    const pathname = new URL(String(path), globalThis.location?.href || 'http://localhost').pathname;
    return pathname === '/api/health' || pathname === '/api/activate' || pathname === '/api/auth/anonymous' || pathname === '/api/auth/refresh';
  }

  async function authorizationHeader(path) {
    if (isAuthExempt(path)) return '';
    const storage = sessionStorageSafe();
    let session;
    try { session = JSON.parse(storage?.getItem('hikma-session') || 'null'); } catch {}
    if (session?.access_token && Number(session.expires_at) > Date.now() + 60_000) {
      return `Bearer ${session.access_token}`;
    }

    const health = await globalThis.HikmaApi.health();
    if (health.mode === 'demo' && health.integrations?.supabase !== 'configured') return '';
    if (session?.refresh_token) {
      try {
        const refreshed = await request('/api/auth/refresh', {method: 'POST', body: JSON.stringify({refresh_token: session.refresh_token})});
        const nextSession = {...refreshed, expires_at: Date.now() + (Number(refreshed.expires_in) || 3600) * 1000};
        storage?.setItem('hikma-session', JSON.stringify(nextSession));
        return `Bearer ${nextSession.access_token}`;
      } catch {
        storage?.removeItem('hikma-session');
      }
    }

    const created = await request('/api/auth/anonymous', {method: 'POST', body: JSON.stringify({})});
    if (!created.access_token || !created.refresh_token) throw apiError('تعذر بدء جلسة آمنة. راجع إعدادات Supabase.', 'auth_unavailable');
    const nextSession = {...created, expires_at: Date.now() + (Number(created.expires_in) || 3600) * 1000};
    storage?.setItem('hikma-session', JSON.stringify(nextSession));
    return `Bearer ${nextSession.access_token}`;
  }

  const api = {
    async health() {
      return request('/api/health');
    },
    async activate(code) {
      const result = await request('/api/activate', {
        method: 'POST',
        body: JSON.stringify({code})
      });
      if (result.mode === 'demo') {
        const health = await request('/api/health');
        if (health.mode !== 'demo') {
          throw apiError('الخادم ليس في الوضع التجريبي. لم يتم التفعيل.', 'not_configured');
        }
      }
      return result;
    },
    async upgradeAccount(email, password) {
      return request('/api/auth/upgrade', {
        method: 'POST',
        body: JSON.stringify({email, password})
      });
    },
    async translate(text, targetLanguage = 'en') {
      return request('/api/translate', {
        method: 'POST',
        body: JSON.stringify({text, targetLanguage})
      });
    },
    async diacritize(text) {
      return request('/api/diacritize', {
        method: 'POST',
        body: JSON.stringify({text})
      });
    },
    async speech(text, language = 'ar', voice = 'device', rate = 1, pitch = 0) {
      return request('/api/speech', {
        method: 'POST',
        body: JSON.stringify({text, language, voice, rate, pitch})
      });
    },
    async importUrl(url) {
      return request('/api/import/url', {method: 'POST', body: JSON.stringify({url})});
    },
    request,
    toFriendlyMessage,
    authorizationHeader,
    isDemoNotConfigured,
    isNetworkError(error) {
      return ['network_error', 'timeout', 'health_unavailable'].includes(error?.code);
    }
  };

  globalThis.HikmaApi = api;
})();
