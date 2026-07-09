'use client';

import { useState } from 'react';
import type {
  ClassRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  UpkkAmaliSolatRecord,
  UpkkPchiRecord,
} from '@/lib/data';
import UpkkAmaliSolatManager from './UpkkAmaliSolatManager';
import UpkkPchiManager from './UpkkPchiManager';

type UpkkAssessmentTabsProps = {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  amaliRecords: UpkkAmaliSolatRecord[];
  pchiRecords: UpkkPchiRecord[];
};

type ActiveTab = 'amali' | 'pchi' | 'alquran';

const tabs: Array<{ key: ActiveTab; label: string }> = [
  { key: 'amali', label: 'UPKK - Amali Solat' },
  { key: 'pchi', label: 'UPKK - PCHI' },
  { key: 'alquran', label: 'UPKK - Al-Quran' },
];

export default function UpkkAssessmentTabs({
  schools,
  moduleAccesses,
  classes,
  students,
  amaliRecords,
  pchiRecords,
}: UpkkAssessmentTabsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('amali');

  return (
    <div className="upkk-assessment-shell">
      <div className="upkk-tabs" role="tablist" aria-label="Jenis penilaian UPKK">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`upkk-tab-button${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'amali' ? (
        <UpkkAmaliSolatManager
          schools={schools}
          moduleAccesses={moduleAccesses}
          classes={classes}
          students={students}
          records={amaliRecords}
        />
      ) : null}

      {activeTab === 'pchi' ? (
        <UpkkPchiManager
          schools={schools}
          moduleAccesses={moduleAccesses}
          classes={classes}
          students={students}
          records={pchiRecords}
        />
      ) : null}

      {activeTab === 'alquran' ? (
        <section className="content-card upkk-placeholder">
          <h2>UPKK - Al-Quran</h2>
          <p className="muted">Paparan ini disediakan selepas format penilaian Al-Quran disahkan.</p>
        </section>
      ) : null}
    </div>
  );
}
