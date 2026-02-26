export interface StudyTopic {
  id: string;
  title: string;
  description: string;
}

export interface StudyProfile {
  id: string;
  name: string;
  topics: StudyTopic[];
  weakAreas: string[];
  studyGoals: string[];
  rawMaterialSummary: string;
  onboardingComplete: boolean;
  createdAt: number;
}
