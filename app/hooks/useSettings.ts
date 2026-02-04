import { useCallback, useEffect, useState } from 'react';
import { getAppSettings, updateAppSettings } from '../storage';
import { AppSettings } from '../storage/types';

const DEFAULT_SETTINGS: AppSettings = {
  confettiEnabled: true,
  hapticFeedbackEnabled: true,
  autoRefreshQuotes: true,
  preferredSlippage: 50,
};

type UseSettingsResult = {
  settings: AppSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const loaded = await getAppSettings();
    setSettings(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await updateAppSettings({ [key]: value });
  }, [settings]);

  return {
    settings,
    isLoading,
    updateSetting,
    refresh: loadSettings,
  };
}
