import { create } from 'zustand';
import { 
  SystemStatus, 
  SyncStatus, 
  StudentDto, 
  MeetingDto, 
  AppointmentDto, 
  TaskDto, 
  DashboardSummary,
  ClassDto,
  MeetingTagDto
} from '@shared/ipc-types';

interface AppState {
  status: SystemStatus | null;
  syncStatus: SyncStatus | null;
  dashboard: DashboardSummary | null;
  students: StudentDto[];
  meetings: MeetingDto[];
  appointments: AppointmentDto[];
  tasks: TaskDto[];
  classes: ClassDto[];
  tags: MeetingTagDto[];
  activities: import('@shared/ipc-types').CounselingActivityDto[];
  isLoading: boolean;
  activeTab: string;
  isSearchOpen: boolean;
  selectedStudentId: string | null;
  isStudentModalOpen: boolean;
  isClassModalOpen: boolean;
  isMeetingModalOpen: boolean;
  isAppointmentModalOpen: boolean;
  isTaskModalOpen: boolean;
  isActivityModalOpen: boolean;
  isKioskActive: boolean;

  isSyncing: boolean;
  lastSyncSummary: string | null;
  lastSyncResult: import('@shared/ipc-types').FullSyncResult | null;

  fetchStatus: () => Promise<void>;
  fetchSyncStatus: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchStudents: (filter?: { search?: string; classId?: string; status?: string }) => Promise<void>;
  fetchMeetings: (filter?: { studentId?: string; meetingType?: string; followUpOnly?: boolean }) => Promise<void>;
  fetchAppointments: (filter?: { date?: string; status?: string }) => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  fetchAllData: () => Promise<void>;

  setActiveTab: (tab: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setSelectedStudentId: (id: string | null) => void;
  setIsStudentModalOpen: (open: boolean) => void;
  setIsClassModalOpen: (open: boolean) => void;
  setIsMeetingModalOpen: (open: boolean) => void;
  setIsAppointmentModalOpen: (open: boolean) => void;
  setIsTaskModalOpen: (open: boolean) => void;
  setIsActivityModalOpen: (open: boolean) => void;
  setIsKioskActive: (active: boolean) => void;

  triggerSync: () => Promise<import('@shared/ipc-types').FullSyncResult | null>;
  executeFullSync: () => Promise<import('@shared/ipc-types').FullSyncResult | null>;
  lockSession: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  status: null,
  syncStatus: null,
  isSyncing: false,
  lastSyncSummary: null,
  lastSyncResult: null,
  dashboard: null,
  students: [],
  meetings: [],
  appointments: [],
  tasks: [],
  classes: [],
  tags: [],
  activities: [],
  isLoading: true,
  activeTab: 'dashboard',
  isSearchOpen: false,
  selectedStudentId: null,
  isStudentModalOpen: false,
  isClassModalOpen: false,
  isMeetingModalOpen: false,
  isAppointmentModalOpen: false,
  isTaskModalOpen: false,
  isActivityModalOpen: false,
  isKioskActive: false,

  fetchStatus: async () => {
    try {
      if (window.api) {
        const status = await window.api.system.getStatus();
        set({ status, isLoading: false });
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  },

  fetchSyncStatus: async () => {
    try {
      if (window.api) {
        const syncStatus = await window.api.sync.getStatus();
        set({ syncStatus });
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  },

  fetchDashboard: async () => {
    try {
      if (window.api) {
        const dashboard = await window.api.system.getDashboardSummary();
        set({ dashboard });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    }
  },

  fetchStudents: async (filter) => {
    try {
      if (window.api) {
        const students = await window.api.students.list(filter);
        set({ students });
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  },

  fetchMeetings: async (filter) => {
    try {
      if (window.api) {
        const meetings = await window.api.meetings.list(filter);
        set({ meetings });
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    }
  },

  fetchAppointments: async (filter) => {
    try {
      if (window.api) {
        const appointments = await window.api.appointments.list(filter);
        set({ appointments });
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  },

  fetchTasks: async () => {
    try {
      if (window.api) {
        const tasks = await window.api.tasks.list();
        set({ tasks });
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  },

  fetchClasses: async () => {
    try {
      if (window.api) {
        const classes = await window.api.schools.getClasses();
        set({ classes });
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  },

  fetchTags: async () => {
    try {
      if (window.api) {
        const tags = await window.api.meetings.getTags();
        set({ tags });
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  },

  fetchActivities: async () => {
    try {
      if (window.api && (window.api as any).activities) {
        const activities = await (window.api as any).activities.list();
        set({ activities });
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  },

  fetchAllData: async () => {
    try {
      await Promise.allSettled([
        get().fetchStatus(),
        get().fetchSyncStatus(),
        get().fetchDashboard(),
        get().fetchStudents(),
        get().fetchMeetings(),
        get().fetchAppointments(),
        get().fetchTasks(),
        get().fetchClasses(),
        get().fetchTags(),
        get().fetchActivities()
      ]);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pdr:data-refreshed', { detail: { timestamp: Date.now() } }));
      }
    } catch (err) {
      console.error('Error fetching all application data:', err);
    }
  },

  setActiveTab: (tab: string) => set({ activeTab: tab }),
  setIsSearchOpen: (open: boolean) => set({ isSearchOpen: open }),
  setSelectedStudentId: (id: string | null) => set({ selectedStudentId: id }),
  setIsStudentModalOpen: (open: boolean) => set({ isStudentModalOpen: open }),
  setIsClassModalOpen: (open: boolean) => set({ isClassModalOpen: open }),
  setIsMeetingModalOpen: (open: boolean) => set({ isMeetingModalOpen: open }),
  setIsAppointmentModalOpen: (open: boolean) => set({ isAppointmentModalOpen: open }),
  setIsTaskModalOpen: (open: boolean) => set({ isTaskModalOpen: open }),
  setIsActivityModalOpen: (open: boolean) => set({ isActivityModalOpen: open }),
  setIsKioskActive: (active: boolean) => set({ isKioskActive: active }),

  triggerSync: async () => {
    return get().executeFullSync();
  },

  executeFullSync: async () => {
    try {
      if (window.api) {
        set({ isSyncing: true });
        set((state) => ({
          syncStatus: state.syncStatus ? { ...state.syncStatus, state: 'syncing' } : null
        }));

        const result = await window.api.sync.executeFullSync();
        
        set({ 
          isSyncing: false, 
          lastSyncSummary: result.summary,
          lastSyncResult: result
        });

        await get().fetchSyncStatus();
        await get().fetchAllData();
        return result;
      }
      return null;
    } catch (err: any) {
      console.error('Full unified sync error:', err);
      set({ isSyncing: false });
      return null;
    }
  },

  lockSession: async () => {
    if (window.api) {
      await window.api.system.lock();
      await get().fetchStatus();
    }
  }
}));
