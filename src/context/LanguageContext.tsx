import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar & Global
    'nav.dashboard': 'Dashboard',
    'nav.children': 'Children & Timeline',
    'nav.attendance': 'Attendance & Pickup',
    'nav.vision': 'Computer Vision AI',
    'nav.a2a': 'A2A & Judge Agent',
    'nav.reports': 'Daily Reports',
    'nav.calendar': 'Daycare Calendar',
    'nav.marketplace': 'Find Care / Directory',
    'nav.media': 'Photos & Media',
    'nav.incidents': 'Incidents & Safety',
    'nav.messages': 'Copilot & Messaging',
    'nav.licensing': 'Licensing & Ratios',
    'nav.security': 'Security, MFA & Biometrics',
    'nav.subscription': 'Subscription & Billing',
    'nav.audit': 'Audit Logs & Compliance',
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.lastSynced': 'Last Synced',
    'status.syncLive': 'Sync: Live',
    'btn.lockdown': 'Emergency Lockdown',
    'btn.testTimeout': 'Test 15m Timeout',

    // Provider Dashboard
    'dash.tabOverview': 'Operations Overview',
    'dash.tabStaffScheduling': 'Staff Scheduling & Ratios',
    'dash.liveFeedTitle': 'Computer Vision Live Feed: Main Playroom',
    'dash.recognitionActive': 'Recognition Active',
    'dash.securityAuditLog': 'Security Audit Log',
    'dash.authStatus': 'Authentication Status',
    'dash.realTimeAnalytics': 'Real-Time Analytics Dashboard',
    'dash.recoveryNodeStatus': 'Recovery Node Status',
    'dash.metricPresent': 'Present',
    'dash.metricExpected': 'Expected',
    'dash.metricCheckedIn': 'Checked In',
    'dash.metricCheckedOut': 'Checked Out',
    'dash.metricRequests': 'Requests',
    'dash.metricMessages': 'Messages',
    'dash.metricOutstanding': 'Outstanding',
    'dash.ratioValid': 'Ratio Valid',
    'dash.childrenInCare': 'Children In Care',
    'dash.safetyTasks': 'Safety Tasks (CV Generated)',
    'dash.cceyaStandard': 'Ontario CCEYA 2014 Active',
    'dash.cceyaDescription': 'Provider license valid for 6 children under 13 (max 10 with certified second staff). Zero violations logged.',

    // Staff Scheduling
    'staff.title': 'Ontario CCEYA Staff Scheduling & Ratio Compliance',
    'staff.subtitle': 'Automate educator-to-child room assignments and provincial legal ratio conflict detection under Ontario Child Care and Early Years Act (CCEYA O. Reg. 137/15).',
    'staff.allCompliant': 'All Rooms Compliant with Legal Ratios',
    'staff.conflictsDetected': 'Legal Ratio Conflict Detected',
    'staff.autoResolve': '1-Click Auto-Balance Staff Roster',
    'staff.addStaff': 'Schedule Educator / Staff',
    'staff.assignToRoom': 'Assign Staff to Room',
    'staff.assignChildToRoom': 'Transfer Child to Room',
    'staff.legalRatioReq': 'Provincial Legal Requirement',
    'staff.currentRatio': 'Current Ratio',
    'staff.staffAssigned': 'Staff Assigned',
    'staff.childrenEnrolled': 'Children Present',
    'staff.deficit': 'Staff Deficit',
    'staff.remediation': 'Recommended Remediation',
    'staff.printAudit': 'Export Ontario Ratio Audit Sheet',
    'staff.rosterTitle': 'Licensed Educators & Caregiver Roster',
    'staff.roomsTitle': 'Classrooms & Learning Environments',
    'staff.onDuty': 'On Duty',
    'staff.onBreak': 'On Break',
    'staff.scheduled': 'Scheduled',
    'staff.offDuty': 'Off Duty',
    'staff.bilingualRece': 'Bilingual RECE Certified (EN/FR)',

    // Incidents & Floor Plan Heatmap
    'incidents.title': 'Incidents, Safety Tasks & Visual Heatmap',
    'incidents.subtitle': 'Child incident reporting, CV inspection tasks, and visual daycare floor plan danger zone heatmaps.',
    'incidents.tabTasks': 'Safety Tasks',
    'incidents.tabLogs': 'Incident Logs',
    'incidents.tabHeatmap': 'Visual Floor Plan Heatmap & Danger Zones',
    'incidents.btnNewTask': 'New Task',
    'incidents.btnReport': 'Report Incident',
    'heatmap.title': 'Daycare Physical Layout & Incident Density Heatmap',
    'heatmap.subtitle': 'Spatial analysis overlays historical incident reports onto the physical facility layout, flagging danger zones for targeted supervision.',
    'heatmap.dangerZonesIdentified': 'Physical Danger Zones Identified',
    'heatmap.highRisk': 'High Risk Danger Zone',
    'heatmap.moderateRisk': 'Moderate Risk Area',
    'heatmap.safeArea': 'Low Risk / Safe Zone',
    'heatmap.legend': 'Heatmap Density Legend',
    'heatmap.zeroIncidents': '0 Incidents (Safe)',
    'heatmap.oneIncident': '1 Incident (Monitored)',
    'heatmap.multipleIncidents': '2+ Incidents (Danger Zone)',
    'heatmap.filterType': 'Filter Incident Type',
    'heatmap.filterSeverity': 'Filter Severity',
    'heatmap.filterRange': 'Date Range',
    'heatmap.supervisionRecommendation': 'Statutory CCEYA Supervision Recommendation',
    'heatmap.createTaskForZone': 'Create Safety Task for this Zone',
    'heatmap.cvFocusCamera': 'Focus CV Camera on Danger Zone',

    // Settings & Language
    'settings.languageTitle': 'Bilingual Licensing Language Settings',
    'settings.languageSubtitle': 'Switch UI language between English and French to satisfy Ontario CCEYA 2014 and French Language Services compliance requirements.',
    'settings.english': 'English (Canada / Ontario)',
    'settings.french': 'Français (Ontario / CCEYA)',
    'settings.complianceBadge': 'Ontario Bilingual Child Care Standards Compliant',
  },
  fr: {
    // Top Bar & Global
    'nav.dashboard': 'Tableau de bord',
    'nav.children': 'Enfants et calendrier',
    'nav.attendance': 'Présence et départ',
    'nav.vision': 'Vision par ordinateur IA',
    'nav.a2a': 'Agent Juge A2A',
    'nav.reports': 'Rapports quotidiens',
    'nav.calendar': 'Calendrier de la garderie',
    'nav.marketplace': 'Répertoire / Garderies',
    'nav.media': 'Photos et médias',
    'nav.incidents': 'Incidents et sécurité',
    'nav.messages': 'Copilote et messagerie',
    'nav.licensing': 'Conformité et ratios',
    'nav.security': 'Sécurité, MFA et biométrie',
    'nav.subscription': 'Abonnement et facturation',
    'nav.audit': 'Registres d\'audit et conformité',
    'status.online': 'En ligne',
    'status.offline': 'Hors ligne',
    'status.lastSynced': 'Dernière synchro',
    'status.syncLive': 'Synchro : Direct',
    'btn.lockdown': 'Verrouillage d\'urgence',
    'btn.testTimeout': 'Tester veille 15m',

    // Provider Dashboard
    'dash.tabOverview': 'Aperçu opérationnel',
    'dash.tabStaffScheduling': 'Horaires du personnel et ratios',
    'dash.liveFeedTitle': 'Flux direct vision par ordinateur : Salle de jeu principale',
    'dash.recognitionActive': 'Reconnaissance active',
    'dash.securityAuditLog': 'Journal d\'audit de sécurité',
    'dash.authStatus': 'État de l\'authentification',
    'dash.realTimeAnalytics': 'Tableau de bord télémétrique en temps réel',
    'dash.recoveryNodeStatus': 'État du nœud de récupération',
    'dash.metricPresent': 'Présents',
    'dash.metricExpected': 'Attendus',
    'dash.metricCheckedIn': 'Enregistrés',
    'dash.metricCheckedOut': 'Sortis',
    'dash.metricRequests': 'Demandes',
    'dash.metricMessages': 'Messages',
    'dash.metricOutstanding': 'En attente',
    'dash.ratioValid': 'Ratio conforme',
    'dash.childrenInCare': 'Enfants accueillis',
    'dash.safetyTasks': 'Tâches de sécurité (IA)',
    'dash.cceyaStandard': 'Loi CCEYA 2014 de l\'Ontario active',
    'dash.cceyaDescription': 'Permis autorisé pour 6 enfants de moins de 13 ans (max 10 avec un éducateur certifié additionnel). Aucune infraction constatée.',

    // Staff Scheduling
    'staff.title': 'Horaires du personnel et conformité des ratios (Loi CCEYA de l\'Ontario)',
    'staff.subtitle': 'Automatisez l\'attribution des éducateurs aux salles et détectez les conflits de ratios légaux prescrits par le Règlement de l\'Ontario 137/15.',
    'staff.allCompliant': 'Toutes les salles respectent les ratios légaux',
    'staff.conflictsDetected': 'Conflit de ratio légal détecté',
    'staff.autoResolve': 'Équilibrer l\'équipe en 1 clic',
    'staff.addStaff': 'Planifier un éducateur',
    'staff.assignToRoom': 'Attribuer le personnel à la salle',
    'staff.assignChildToRoom': 'Transférer un enfant vers une salle',
    'staff.legalRatioReq': 'Exigence légale provinciale',
    'staff.currentRatio': 'Ratio actuel',
    'staff.staffAssigned': 'Personnel assigné',
    'staff.childrenEnrolled': 'Enfants présents',
    'staff.deficit': 'Déficit de personnel',
    'staff.remediation': 'Action corrective recommandée',
    'staff.printAudit': 'Exporter la feuille de vérification des ratios',
    'staff.rosterTitle': 'Liste des éducateurs(trices) EPEI et assistants certifiés',
    'staff.roomsTitle': 'Salles de classe et environnements d\'apprentissage',
    'staff.onDuty': 'En service',
    'staff.onBreak': 'En pause',
    'staff.scheduled': 'Planifié',
    'staff.offDuty': 'Hors service',
    'staff.bilingualRece': 'Certifié EPEI bilingue (FR/EN)',

    // Incidents & Floor Plan Heatmap
    'incidents.title': 'Incidents, tâches de sécurité et carte thermique',
    'incidents.subtitle': 'Rapports d\'incidents, tâches d\'inspection préventive et carte thermique des zones de danger physique de la garderie.',
    'incidents.tabTasks': 'Tâches de sécurité',
    'incidents.tabLogs': 'Registre des incidents',
    'incidents.tabHeatmap': 'Plan d\'étage thermique et zones de danger',
    'incidents.btnNewTask': 'Nouvelle tâche',
    'incidents.btnReport': 'Signaler un incident',
    'heatmap.title': 'Plan d\'étage physique et carte de densité des incidents',
    'heatmap.subtitle': 'L\'analyse spatiale superpose les incidents historiques sur le plan d\'aménagement pour identifier les zones de danger nécessitant une surveillance accrue.',
    'heatmap.dangerZonesIdentified': 'Zones de danger physique identifiées',
    'heatmap.highRisk': 'Zone de danger à risque élevé',
    'heatmap.moderateRisk': 'Zone à risque modéré',
    'heatmap.safeArea': 'Zone sécuritaire à faible risque',
    'heatmap.legend': 'Légende de densité thermique',
    'heatmap.zeroIncidents': '0 incident (Sécuritaire)',
    'heatmap.oneIncident': '1 incident (Surveillé)',
    'heatmap.multipleIncidents': '2+ incidents (Zone de danger)',
    'heatmap.filterType': 'Filtrer par type d\'incident',
    'heatmap.filterSeverity': 'Filtrer par gravité',
    'heatmap.filterRange': 'Période',
    'heatmap.supervisionRecommendation': 'Recommandation de surveillance légale CCEYA',
    'heatmap.createTaskForZone': 'Créer une tâche d\'inspection pour cette zone',
    'heatmap.cvFocusCamera': 'Orienter la caméra IA sur cette zone de danger',

    // Settings & Language
    'settings.languageTitle': 'Paramètres linguistiques de conformité bilingue',
    'settings.languageSubtitle': 'Basculez l\'interface entre l\'anglais et le français pour satisfaire aux normes de la Loi de 2014 sur la garde d\'enfants et aux exigences de services en français de l\'Ontario.',
    'settings.english': 'English (Canada / Ontario)',
    'settings.french': 'Français (Ontario / CCEYA)',
    'settings.complianceBadge': 'Conforme aux normes de garde d\'enfants bilingues de l\'Ontario',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('daycare_lang');
      if (saved === 'fr' || saved === 'en') return saved;
    } catch (e) {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('daycare_lang', lang);
    } catch (e) {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || fallback || TRANSLATIONS['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
