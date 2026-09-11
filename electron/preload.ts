import { contextBridge, ipcRenderer } from 'electron';
import { ElectronApi, SetupWizardPayload, UnlockPayload } from '../shared/ipc-types';

const api: ElectronApi = {
  system: {
    getStatus: () => ipcRenderer.invoke('system:getStatus'),
    unlock: (payload: UnlockPayload) => ipcRenderer.invoke('system:unlock', payload),
    lock: () => ipcRenderer.invoke('system:lock'),
    completeWizard: (payload: SetupWizardPayload) => ipcRenderer.invoke('system:completeWizard', payload),
    changePassword: (payload: { masterKey: string; newPassword: string }) => ipcRenderer.invoke('system:changePassword', payload),
    getDeviceId: () => ipcRenderer.invoke('system:getDeviceId'),
    getDashboardSummary: () => ipcRenderer.invoke('system:getDashboardSummary')
  },
  water: {
    getTodayCount: () => ipcRenderer.invoke('water:getTodayCount'),
    setTodayCount: (count: number) => ipcRenderer.invoke('water:setTodayCount', count)
  },
  sync: {
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    triggerSync: () => ipcRenderer.invoke('sync:triggerSync'),
    executeFullSync: () => ipcRenderer.invoke('sync:executeFullSync'),
    getConflicts: () => ipcRenderer.invoke('sync:getConflicts'),
    resolveConflict: (conflictId, resolution, mergedData) =>
      ipcRenderer.invoke('sync:resolveConflict', conflictId, resolution, mergedData)
  },
  schools: {
    getClasses: (schoolYearId) => ipcRenderer.invoke('schools:getClasses', schoolYearId),
    createClass: (data) => ipcRenderer.invoke('schools:createClass', data),
    updateClass: (id, data) => ipcRenderer.invoke('schools:updateClass', id, data),
    deleteClass: (id) => ipcRenderer.invoke('schools:deleteClass', id),
    saveClassPdf: (classId, fileName, fileBase64) => ipcRenderer.invoke('schools:saveClassPdf', classId, fileName, fileBase64),
    deleteClassPdf: (classId) => ipcRenderer.invoke('schools:deleteClassPdf', classId),
    openClassPdf: (classId) => ipcRenderer.invoke('schools:openClassPdf', classId)
  },
  activities: {
    list: (schoolYearId) => ipcRenderer.invoke('activities:list', schoolYearId),
    create: (data) => ipcRenderer.invoke('activities:create', data),
    update: (id, data) => ipcRenderer.invoke('activities:update', id, data),
    delete: (id) => ipcRenderer.invoke('activities:delete', id)
  },
  studyPrograms: {
    listPlans: (schoolYearId) => ipcRenderer.invoke('studyPrograms:listPlans', schoolYearId),
    createPlan: (data) => ipcRenderer.invoke('studyPrograms:createPlan', data),
    deletePlan: (id) => ipcRenderer.invoke('studyPrograms:deletePlan', id),
    listTemplates: () => ipcRenderer.invoke('studyPrograms:listTemplates'),
    saveTemplate: (data) => ipcRenderer.invoke('studyPrograms:saveTemplate', data),
    deleteTemplate: (id) => ipcRenderer.invoke('studyPrograms:deleteTemplate', id)
  },
  documents: {
    list: (search) => ipcRenderer.invoke('documents:list', search),
    create: (data) => ipcRenderer.invoke('documents:create', data),
    delete: (id) => ipcRenderer.invoke('documents:delete', id),
    getFileData: (id) => ipcRenderer.invoke('documents:getFileData', id),
    getPreviewData: (id) => ipcRenderer.invoke('documents:getPreviewData', id),
    download: (id) => ipcRenderer.invoke('documents:download', id)
  },
  presentations: {
    list: (search) => ipcRenderer.invoke('presentations:list', search),
    getById: (id) => ipcRenderer.invoke('presentations:getById', id),
    getContent: (id) => ipcRenderer.invoke('presentations:getContent', id),
    create: (data) => ipcRenderer.invoke('presentations:create', data),
    delete: (id) => ipcRenderer.invoke('presentations:delete', id),
    download: (id) => ipcRenderer.invoke('presentations:download', id)
  },
  students: {
    list: (filter) => ipcRenderer.invoke('students:list', filter),
    getById: (id) => ipcRenderer.invoke('students:getById', id),
    create: (data) => ipcRenderer.invoke('students:create', data),
    update: (id, data) => ipcRenderer.invoke('students:update', id, data),
    softDelete: (id) => ipcRenderer.invoke('students:softDelete', id)
  },
  meetings: {
    list: (filter) => ipcRenderer.invoke('meetings:list', filter),
    getById: (id) => ipcRenderer.invoke('meetings:getById', id),
    create: (data) => ipcRenderer.invoke('meetings:create', data),
    update: (id, data) => ipcRenderer.invoke('meetings:update', id, data),
    setMebbisStatus: (id, isProcessed) => ipcRenderer.invoke('meetings:setMebbisStatus', id, isProcessed),
    softDelete: (id) => ipcRenderer.invoke('meetings:softDelete', id),
    getTags: () => ipcRenderer.invoke('meetings:getTags')
  },
  appointments: {
    list: (filter) => ipcRenderer.invoke('appointments:list', filter),
    create: (data) => ipcRenderer.invoke('appointments:create', data),
    updateStatus: (id, status, resultNote) => ipcRenderer.invoke('appointments:updateStatus', id, status, resultNote),
    softDelete: (id) => ipcRenderer.invoke('appointments:softDelete', id)
  },
  tasks: {
    list: (filter) => ipcRenderer.invoke('tasks:list', filter),
    create: (data) => ipcRenderer.invoke('tasks:create', data),
    toggleComplete: (id, completed) => ipcRenderer.invoke('tasks:toggleComplete', id, completed),
    softDelete: (id) => ipcRenderer.invoke('tasks:softDelete', id)
  },
  dailyNotes: {
    listByDate: (noteDate) => ipcRenderer.invoke('dailyNotes:listByDate', noteDate),
    create: (data) => ipcRenderer.invoke('dailyNotes:create', data),
    update: (id, content) => ipcRenderer.invoke('dailyNotes:update', id, content),
    toggleComplete: (id, completed) => ipcRenderer.invoke('dailyNotes:toggleComplete', id, completed),
    delete: (id) => ipcRenderer.invoke('dailyNotes:delete', id)
  },
  search: {
    query: (term) => ipcRenderer.invoke('search:query', term)
  },
  surveys: {
    list: () => ipcRenderer.invoke('surveys:list'),
    getById: (id) => ipcRenderer.invoke('surveys:getById', id),
    getBySlug: (slug) => ipcRenderer.invoke('surveys:getBySlug', slug),
    listApplications: (filter) => ipcRenderer.invoke('surveys:listApplications', filter),
    getApplicationDetail: (id) => ipcRenderer.invoke('surveys:getApplicationDetail', id),
    submitApplication: (payload) => ipcRenderer.invoke('surveys:submitApplication', payload),
    validateStudentForSurvey: (surveySlug, studentNumber) => ipcRenderer.invoke('surveys:validateStudentForSurvey', surveySlug, studentNumber),
    toggleSurveyActive: (surveyId, isActive) => ipcRenderer.invoke('surveys:toggleSurveyActive', surveyId, isActive),
    getAnalytics: (surveyId) => ipcRenderer.invoke('surveys:getAnalytics', surveyId),
    create: (data) => ipcRenderer.invoke('surveys:create', data),
    assign: (data) => ipcRenderer.invoke('surveys:assign', data),
    listAssignments: (filter) => ipcRenderer.invoke('surveys:listAssignments', filter),
    getAssignmentByRef: (ref) => ipcRenderer.invoke('surveys:getAssignmentByRef', ref),
    submitResponse: (payload) => ipcRenderer.invoke('surveys:submitResponse', payload),
    listResponses: (filter) => ipcRenderer.invoke('surveys:listResponses', filter),
    generateOfflinePackageHtml: (surveyId, passphrase) => ipcRenderer.invoke('surveys:generateOfflinePackageHtml', surveyId, passphrase),
    importOfflineResult: (encryptedPayload, passphrase) => ipcRenderer.invoke('surveys:importOfflineResult', encryptedPayload, passphrase),
    exportPdfReport: (applicationId) => ipcRenderer.invoke('surveys:exportPdfReport', applicationId),
    getReportHtml: (applicationId) => ipcRenderer.invoke('surveys:getReportHtml', applicationId),
    exportPaperFormPdf: (surveySlugOrId) => ipcRenderer.invoke('surveys:exportPaperFormPdf', surveySlugOrId),
    getPaperFormHtml: (surveySlugOrId) => ipcRenderer.invoke('surveys:getPaperFormHtml', surveySlugOrId)
  },
  dataTransfer: {
    exportPackage: (password?: string) => ipcRenderer.invoke('dataTransfer:exportPackage', password),
    selectBackupFile: () => ipcRenderer.invoke('dataTransfer:selectBackupFile'),
    inspectPackage: (filePath: string, password?: string) => ipcRenderer.invoke('dataTransfer:inspectPackage', filePath, password),
    importPackage: (filePath: string, password?: string) => ipcRenderer.invoke('dataTransfer:importPackage', filePath, password),
    resetDatabase: (masterPassword?: string) => ipcRenderer.invoke('dataTransfer:resetDatabase', masterPassword),
    getCurrentCounts: () => ipcRenderer.invoke('dataTransfer:getCurrentCounts'),
    getLastBackupInfo: () => ipcRenderer.invoke('dataTransfer:getLastBackupInfo')
  },
  studentMode: {
    enter: (ref) => ipcRenderer.invoke('studentMode:enter', ref),
    exit: (password) => ipcRenderer.invoke('studentMode:exit', password),
    getState: () => ipcRenderer.invoke('studentMode:getState')
  },
  exams: {
    list: () => ipcRenderer.invoke('exams:list'),
    getById: (id) => ipcRenderer.invoke('exams:getById', id),
    create: (data) => ipcRenderer.invoke('exams:create', data),
    getSubjects: (examType) => ipcRenderer.invoke('exams:getSubjects', examType),
    recordResult: (data) => ipcRenderer.invoke('exams:recordResult', data),
    listResults: (filter) => ipcRenderer.invoke('exams:listResults', filter),
    getTargets: (studentId) => ipcRenderer.invoke('exams:getTargets', studentId),
    createTarget: (data) => ipcRenderer.invoke('exams:createTarget', data),
    updateTargetStatus: (id, status) => ipcRenderer.invoke('exams:updateTargetStatus', id, status),
    getStudyPlans: (studentId) => ipcRenderer.invoke('exams:getStudyPlans', studentId),
    createStudyPlan: (data) => ipcRenderer.invoke('exams:createStudyPlan', data),
    updateStudyPlanItemStatus: (itemId, status, completedQuestions) =>
      ipcRenderer.invoke('exams:updateStudyPlanItemStatus', itemId, status, completedQuestions),
    getQuestionLogs: (filter) => ipcRenderer.invoke('exams:getQuestionLogs', filter),
    logQuestions: (data) => ipcRenderer.invoke('exams:logQuestions', data)
  },
  agenda: {
    list: (params) => ipcRenderer.invoke('agenda:list', params),
    create: (data) => ipcRenderer.invoke('agenda:create', data),
    update: (id, data) => ipcRenderer.invoke('agenda:update', id, data),
    toggleComplete: (id, completed) => ipcRenderer.invoke('agenda:toggleComplete', id, completed),
    delete: (id) => ipcRenderer.invoke('agenda:delete', id)
  },
  annualPlans: {
    get: (schoolYearId) => ipcRenderer.invoke('annualPlans:get', schoolYearId),
    createOrUpdate: (data) => ipcRenderer.invoke('annualPlans:createOrUpdate', data),
    addItem: (data) => ipcRenderer.invoke('annualPlans:addItem', data),
    updateItem: (id, data) => ipcRenderer.invoke('annualPlans:updateItem', id, data),
    updateItemStatus: (itemId, status) => ipcRenderer.invoke('annualPlans:updateItemStatus', itemId, status),
    deleteItem: (itemId) => ipcRenderer.invoke('annualPlans:deleteItem', itemId)
  },
  reports: {
    getSchoolAnalytics: () => ipcRenderer.invoke('reports:getSchoolAnalytics'),
    exportStudentsExcel: () => ipcRenderer.invoke('reports:exportStudentsExcel'),
    importStudentsExcel: (dataBase64) => ipcRenderer.invoke('reports:importStudentsExcel', dataBase64),
    getStudentGuidanceReportHtml: (studentId) => ipcRenderer.invoke('reports:getStudentGuidanceReportHtml', studentId),
    getBepPlanReportHtml: (bepPlanId) => ipcRenderer.invoke('reports:getBepPlanReportHtml', bepPlanId),
    getBipPlanReportHtml: (bipPlanId) => ipcRenderer.invoke('reports:getBipPlanReportHtml', bipPlanId),
    getRamReferralReportHtml: (referralId) => ipcRenderer.invoke('reports:getRamReferralReportHtml', referralId),
    exportHtmlToPdf: (html, outputPath) => ipcRenderer.invoke('reports:exportHtmlToPdf', html, outputPath)
  },
  specialEducation: {
    createRamReport: (dto) => ipcRenderer.invoke('specialEducation:createRamReport', dto),
    updateRamReport: (id, dto) => ipcRenderer.invoke('specialEducation:updateRamReport', id, dto),
    deleteRamReport: (id) => ipcRenderer.invoke('specialEducation:deleteRamReport', id),
    getRamReportById: (id) => ipcRenderer.invoke('specialEducation:getRamReportById', id),
    listRamReportsByStudent: (studentId) => ipcRenderer.invoke('specialEducation:listRamReportsByStudent', studentId),
    listAllRamReports: () => ipcRenderer.invoke('specialEducation:listAllRamReports'),

    createBepPlan: (dto) => ipcRenderer.invoke('specialEducation:createBepPlan', dto),
    updateBepPlan: (id, dto) => ipcRenderer.invoke('specialEducation:updateBepPlan', id, dto),
    deleteBepPlan: (id) => ipcRenderer.invoke('specialEducation:deleteBepPlan', id),
    getBepPlanById: (id) => ipcRenderer.invoke('specialEducation:getBepPlanById', id),
    listBepPlansByStudent: (studentId) => ipcRenderer.invoke('specialEducation:listBepPlansByStudent', studentId),
    listAllBepPlans: () => ipcRenderer.invoke('specialEducation:listAllBepPlans'),

    addBepGoal: (dto) => ipcRenderer.invoke('specialEducation:addBepGoal', dto),
    updateBepGoal: (id, dto) => ipcRenderer.invoke('specialEducation:updateBepGoal', id, dto),
    updateGoalStatus: (id, status, notes) => ipcRenderer.invoke('specialEducation:updateGoalStatus', id, status, notes),
    deleteBepGoal: (id) => ipcRenderer.invoke('specialEducation:deleteBepGoal', id),
    listGoalsByPlanId: (planId) => ipcRenderer.invoke('specialEducation:listGoalsByPlanId', planId),
    listGoalsByStudentId: (studentId) => ipcRenderer.invoke('specialEducation:listGoalsByStudentId', studentId),

    createBipPlan: (dto) => ipcRenderer.invoke('specialEducation:createBipPlan', dto),
    updateBipPlan: (id, dto) => ipcRenderer.invoke('specialEducation:updateBipPlan', id, dto),
    deleteBipPlan: (id) => ipcRenderer.invoke('specialEducation:deleteBipPlan', id),
    getBipPlanById: (id) => ipcRenderer.invoke('specialEducation:getBipPlanById', id),
    listBipPlansByStudent: (studentId) => ipcRenderer.invoke('specialEducation:listBipPlansByStudent', studentId),
    listAllBipPlans: () => ipcRenderer.invoke('specialEducation:listAllBipPlans'),

    createEvaluation: (dto) => ipcRenderer.invoke('specialEducation:createEvaluation', dto),
    updateEvaluation: (id, dto) => ipcRenderer.invoke('specialEducation:updateEvaluation', id, dto),
    deleteEvaluation: (id) => ipcRenderer.invoke('specialEducation:deleteEvaluation', id),
    getEvaluationById: (id) => ipcRenderer.invoke('specialEducation:getEvaluationById', id),
    listEvaluationsByStudent: (studentId) => ipcRenderer.invoke('specialEducation:listEvaluationsByStudent', studentId),
    listAllEvaluations: () => ipcRenderer.invoke('specialEducation:listAllEvaluations'),

    createReferral: (dto) => ipcRenderer.invoke('specialEducation:createReferral', dto),
    updateReferral: (id, dto) => ipcRenderer.invoke('specialEducation:updateReferral', id, dto),
    updateReferralStatus: (id, status, resultNotes) => ipcRenderer.invoke('specialEducation:updateReferralStatus', id, status, resultNotes),
    deleteReferral: (id) => ipcRenderer.invoke('specialEducation:deleteReferral', id),
    getReferralById: (id) => ipcRenderer.invoke('specialEducation:getReferralById', id),
    listReferralsByStudent: (studentId) => ipcRenderer.invoke('specialEducation:listReferralsByStudent', studentId),
    listAllReferrals: () => ipcRenderer.invoke('specialEducation:listAllReferrals')
  },
  updater: {
    getStatus: () => ipcRenderer.invoke('updater:getStatus'),
    checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:downloadUpdate'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),
    onStatusChange: (callback) => {
      const listener = (_event: any, status: any) => callback(status);
      ipcRenderer.on('updater:statusChanged', listener);
      return () => {
        ipcRenderer.removeListener('updater:statusChanged', listener);
      };
    },
    onDownloadProgress: (callback) => {
      const listener = (_event: any, progress: any) => callback(progress);
      ipcRenderer.on('updater:downloadProgress', listener);
      return () => {
        ipcRenderer.removeListener('updater:downloadProgress', listener);
      };
    }
  }
};

contextBridge.exposeInMainWorld('api', api);
