/**
 * Reports Store
 * Manages saved valuation reports
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ValuationResponse } from '../types/valuation';

export interface SavedReport {
  id: string;
  company_name: string;
  created_at: string;
  source: 'manual' | 'instant' | 'document';
  result: ValuationResponse;
  form_data?: any;
}

interface ReportsStore {
  reports: SavedReport[];
  
  // Actions
  addReport: (report: Omit<SavedReport, 'id' | 'created_at'>) => void;
  deleteReport: (id: string) => void;
  clearAllReports: () => void;
  getReportById: (id: string) => SavedReport | undefined;
}

export const useReportsStore = create<ReportsStore>()(
  persist(
    (set, get) => ({
      reports: [],
      
      addReport: (report) => {
        const newReport: SavedReport = {
          ...report,
          id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
        };
        
        set((state) => ({
          reports: [newReport, ...state.reports], // Add new report at the beginning
        }));
        
        return newReport;
      },
      
      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id),
        }));
      },
      
      clearAllReports: () => {
        set({ reports: [] });
      },
      
      getReportById: (id) => {
        return get().reports.find((report) => report.id === id);
      },
    }),
    {
      name: 'upswitch-valuation-reports', // localStorage key
    }
  )
);
