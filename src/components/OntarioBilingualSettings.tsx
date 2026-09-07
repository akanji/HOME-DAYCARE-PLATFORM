import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  FileCheck,
  Languages,
  ShieldCheck,
  Scale,
  Sparkles,
  Printer,
  Info,
  Check,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const OntarioBilingualSettings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const isFr = language === 'fr';
  const [showCertificate, setShowCertificate] = useState(false);

  const complianceItems = [
    {
      titleEn: 'Bilingual Emergency Evacuation Procedures',
      titleFr: 'Procédures d\'évacuation d\'urgence bilingues',
      descEn: 'Floor evacuation plans and emergency exit guidelines displayed in EN and FR as required by Ontario Fire & CCEYA.',
      descFr: 'Plans d\'évacuation et consignes de sortie affichés en EN et FR selon les normes incendie et CCEYA.',
      status: 'VERIFIED',
    },
    {
      titleEn: 'Official Incident & Injury Reports (Formulaire officiel)',
      titleFr: 'Rapports d\'incidents et blessures bilingues',
      descEn: 'Incident descriptions, bodily injury locations, and staff signatures supported in both official languages.',
      descFr: 'Descriptions d\'incidents, localisations de blessures et signatures du personnel supportées dans les deux langues.',
      status: 'VERIFIED',
    },
    {
      titleEn: 'Educator Staff Scheduling & Ratio Matrices',
      titleFr: 'Grilles de ratio et planification du personnel',
      descEn: 'Infant, Toddler, and Preschool room ratio matrices verifiable in English and French during Ministry inspections.',
      descFr: 'Matrices de ratio nourrissons, bambins et préscolaire vérifiables en anglais et français pour inspection ministérielle.',
      status: 'VERIFIED',
    },
    {
      titleEn: 'Parent Portal & Daily Reports Translation',
      titleFr: 'Portail des parents et rapports journaliers',
      descEn: 'Daily feeding, nap, mood, and educational milestones available in English and French for Francophone families.',
      descFr: 'Repas quotidiens, siestes, humeur et jalons éducatifs disponibles en anglais et en français pour les familles francophones.',
      status: 'VERIFIED',
    },
  ];

  const translationMatrix = [
    { element: 'Dashboard / Accueil', en: 'Live Operations & Supervision', fr: 'Opérations en direct et supervision' },
    { element: 'Staff Scheduling / Personnel', en: 'CCEYA Ratio & Staff Scheduling', fr: 'Planification du personnel et ratios CCEYA' },
    { element: 'Children / Enfants', en: 'Children Roster & Timelines', fr: 'Registre des enfants et chronologies' },
    { element: 'Attendance / Présence', en: 'Daily Attendance & Authorized Pickup', fr: 'Présence quotidienne et départs autorisés' },
    { element: 'Incidents / Sécurité', en: 'Incident Logs & Hazard Danger Heatmap', fr: 'Rapports d\'incidents et carte thermique des dangers' },
    { element: 'Daily Reports / Rapports', en: 'Daily Care Reports & Milestones', fr: 'Rapports journaliers de garde et jalons' },
    { element: 'Billing / Facturation', en: 'CWELCC Subsidy & Tuition Invoicing', fr: 'Subvention CWELCC et facturation des frais' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner: Language Selector & Ontario Compliance */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400">
              <Languages className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-100 font-display">
                {t('settings.languageSettings')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {t('settings.languageDescription')}
              </p>
            </div>
          </div>

          {/* Large Language Toggle Pill */}
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 self-start lg:self-center">
            <button
              id="language-toggle-english-btn"
              onClick={() => setLanguage('en')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-neutral-200'
              }`}
            >
              <span className="text-base">🇨🇦</span>
              <span>English (EN)</span>
              {language === 'en' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              id="language-toggle-french-btn"
              onClick={() => setLanguage('fr')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                language === 'fr'
                  ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-neutral-200'
              }`}
            >
              <span className="text-base">⚜️</span>
              <span>Français (FR)</span>
              {language === 'fr' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ontario Bilingual Licensing Compliance Status Badge */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-gray-800 dark:text-neutral-200">
              {t('settings.ontarioComplianceBadge')}:
            </span>
            <span className="text-gray-600 dark:text-neutral-400 font-mono text-[11px]">
              Ontario French Language Services Act (R.S.O. 1990) & CCEYA O. Reg. 137/15 S. 12
            </span>
          </div>

          <button
            onClick={() => setShowCertificate(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{isFr ? 'Certificat de conformité bilingue' : 'View Bilingual Compliance Declaration'}</span>
          </button>
        </div>
      </div>

      {/* Bilingual Licensing Policy Checklist */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono flex items-center gap-2">
            <Scale className="w-4 h-4" />
            <span>Ontario Ministry of Education Bilingual Compliance Verification</span>
          </h3>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            4 OF 4 STANDARDS SATISFIED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#141611] space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 dark:text-neutral-100">
                  {isFr ? item.titleFr : item.titleEn}
                </h4>
                <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950">
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-neutral-400 leading-relaxed">
                {isFr ? item.descFr : item.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Core UI Elements Translation Matrix */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Core UI Bilingual Translation Matrix (Active Registry)</span>
          </h3>
          <span className="text-[10px] font-mono text-gray-400">
            Live Synchronization: {language.toUpperCase()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-800 text-gray-400 font-mono text-[10px] uppercase">
                <th className="pb-2">Platform Module</th>
                <th className="pb-2">English (Official)</th>
                <th className="pb-2">Français (Officiel)</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {translationMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 font-bold text-gray-900 dark:text-neutral-100">
                    {row.element}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-gray-700 dark:text-neutral-300">
                    {row.en}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-gray-700 dark:text-neutral-300">
                    {row.fr}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BILINGUAL COMPLIANCE DECLARATION CERTIFICATE */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-mono uppercase">
                  Ontario Bilingual Licensing Compliance Certificate
                </h3>
              </div>
              <button
                onClick={() => setShowCertificate(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 font-mono text-xs space-y-3 bg-gray-50/50 dark:bg-[#12140f]">
              <div className="text-center pb-2 border-b">
                <h4 className="font-bold text-sm text-gray-900 dark:text-neutral-100">
                  DECLARATION OF BILINGUAL SERVICE READINESS / DÉCLARATION DE CONFORMITÉ
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Pursuant to Ontario Child Care and Early Years Act (CCEYA, 2014) & French Language Services Act
                </p>
              </div>

              <p className="text-[11px] text-gray-700 dark:text-neutral-300 leading-relaxed">
                This certifies that <strong>Sunshine Home Daycare Network</strong> (Provincial License #ON-77821) maintains a fully bilingual management platform capable of instantaneous English and French operation across all vital administrative registers:
              </p>

              <ul className="list-disc pl-5 space-y-1 text-[10px] text-gray-600 dark:text-neutral-400">
                <li>Real-time Child-to-Teacher Ratio Conflict Resolution (Ontario Reg 137/15 S. 8)</li>
                <li>Child Emergency Incident & Injury Reporting with physical location zone mapping</li>
                <li>Bi-directional Guardian Communications and Daily Pedagogical Observations</li>
                <li>Staff Scheduling and CECE Professional Registration Verification</li>
              </ul>

              <div className="pt-3 border-t flex justify-between text-[10px] text-gray-500">
                <span>Director in Charge: Clara Oswald, RECE #55201</span>
                <span>Verification Date: {new Date().toLocaleDateString('en-CA')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#52632B] hover:bg-[#3E4C1E] text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Declaration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
