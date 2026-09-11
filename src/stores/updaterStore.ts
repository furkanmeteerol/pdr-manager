import { create } from 'zustand';
import { UpdateStatus, UpdateProgress } from '@shared/ipc-types';

interface UpdaterState {
  status: UpdateStatus;
  isChecking: boolean;
  isDownloading: boolean;
  actionError: string | null;

  fetchStatus: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<boolean>;
  quitAndInstall: () => Promise<boolean>;
  initListeners: () => () => void;
}

const initialStatus: UpdateStatus = {
  state: 'idle',
  currentVersion: '1.0.0',
  availableVersion: null,
  releaseDate: null,
  releaseNotes: null,
  progress: null,
  errorMessage: null,
  feedUrl: '',
  checkedAt: null
};

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  status: initialStatus,
  isChecking: false,
  isDownloading: false,
  actionError: null,

  fetchStatus: async () => {
    if (!window.api?.updater) return;
    try {
      const status = await window.api.updater.getStatus();
      set({ status });
    } catch (err: any) {
      console.warn('Failed to fetch updater status:', err);
    }
  },

  checkForUpdates: async () => {
    if (!window.api?.updater) return;
    set({ isChecking: true, actionError: null });
    try {
      const status = await window.api.updater.checkForUpdates();
      set({ status, isChecking: false });
    } catch (err: any) {
      set({ 
        isChecking: false, 
        actionError: err?.message || 'Güncelleme kontrolü sırasında bir hata oluştu.' 
      });
    }
  },

  downloadUpdate: async () => {
    if (!window.api?.updater) return false;
    set({ isDownloading: true, actionError: null });
    try {
      const res = await window.api.updater.downloadUpdate();
      if (!res.success) {
        set({ isDownloading: false, actionError: res.error || 'İndirme başlatılamadı.' });
        return false;
      }
      return true;
    } catch (err: any) {
      set({ 
        isDownloading: false, 
        actionError: err?.message || 'Güncelleme indirilemedi.' 
      });
      return false;
    }
  },

  quitAndInstall: async () => {
    if (!window.api?.updater) return false;
    try {
      const res = await window.api.updater.quitAndInstall();
      if (!res.success) {
        set({ actionError: res.error || 'Güncelleme uygulanamadı.' });
        return false;
      }
      return true;
    } catch (err: any) {
      set({ actionError: err?.message || 'Uygulama yeniden başlatılamadı.' });
      return false;
    }
  },

  initListeners: () => {
    if (!window.api?.updater) return () => {};

    // Fetch initial status
    get().fetchStatus();

    const unsubStatus = window.api.updater.onStatusChange((newStatus: UpdateStatus) => {
      set({
        status: newStatus,
        isChecking: newStatus.state === 'checking',
        isDownloading: newStatus.state === 'downloading'
      });
    });

    const unsubProgress = window.api.updater.onDownloadProgress((progress: UpdateProgress) => {
      set((state) => ({
        status: {
          ...state.status,
          state: 'downloading',
          progress
        },
        isDownloading: true
      }));
    });

    return () => {
      unsubStatus();
      unsubProgress();
    };
  }
}));
