export interface Video {
  id: string;
  title: string;
  channel: string;
  durationMin: number;
}

export interface StepForm {
  videoId: string;
  order: number;
  whyThis: string;
  checkpointQuestion: string;
}

export interface PathStep extends StepForm {
  id: string;
  video: Video;
}

export interface Path {
  id: string;
  title: string;
  targetAudience: string;
  goal: string;
  totalTimeEstimate: number;
  isPublished: boolean;
  stepCount: number;
  steps: PathStep[];
}

export interface PathFormData {
  title: string;
  targetAudience: string;
  goal: string;
  totalTimeEstimate: number;
  isPublished: boolean;
  steps: StepForm[];
}

export const emptyForm: PathFormData = {
  title: "",
  targetAudience: "",
  goal: "",
  totalTimeEstimate: 0,
  isPublished: true,
  steps: [],
};
