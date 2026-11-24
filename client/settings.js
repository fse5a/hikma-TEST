(() => {
  const defaults = Object.freeze({
    rate: 1,
    pitch: 0,
    announcementRate: 1,
    a11y: false,
    voiceSource: 'device',
    textScale: 100,
    lineSpacing: 2.1,
    highContrast: false,
    dyslexiaFont: false,
    reducedMotion: false,
    voiceGuidance: true,
    simpleMode: false,
    haptics: false,
    highlightStyle: 'yellow',
    schemaVersion: 1
  });

  function clampRate(value) {
    const rate = Number(value);
    return Number.isFinite(rate) ? Math.max(0.5, Math.min(2, rate)) : defaults.rate;
  }

  function clampPitch(value) {
    const pitch = Number(value);
    return Number.isFinite(pitch) ? Math.max(-6, Math.min(6, pitch)) : defaults.pitch;
  }

  function normalize(settings = {}) {
    const migrated = {...settings};
    if (migrated.schemaVersion !== defaults.schemaVersion) {
      const oldPitch = Number(migrated.pitch);
      migrated.pitch = Number.isFinite(oldPitch) && oldPitch > 0
        ? 12 * Math.log2(oldPitch)
        : defaults.pitch;
    }
    migrated.rate = clampRate(migrated.rate);
    migrated.pitch = clampPitch(migrated.pitch);
    migrated.announcementRate = clampRate(migrated.announcementRate);
    migrated.schemaVersion = defaults.schemaVersion;
    return migrated;
  }

  globalThis.HikmaSettings = Object.freeze({defaults, clampRate, clampPitch, normalize});
})();