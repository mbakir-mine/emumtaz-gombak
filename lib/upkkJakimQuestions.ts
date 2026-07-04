import rawQuestionGroups from '../outputs/upkk_questions.json';
import {
  upkkComponentsByType,
  upkkJakimComponents,
  type UpkkJakimAssessmentType,
} from './upkkJakim';

export type UpkkQuestionItem = {
  number: string;
  title: string;
  maxMark: number;
};

export type UpkkQuestionGroup = {
  number: string;
  title: string;
  maxMark: number;
  items: UpkkQuestionItem[];
};

export type UpkkScorableQuestion = {
  key: string;
  componentKey: string;
  componentTitle: string;
  assessmentType: UpkkJakimAssessmentType;
  section: string;
  number: string;
  title: string;
  maxMark: number;
  helper: string;
};

type RawQuestionGroups = Record<string, UpkkQuestionGroup[]>;

const upkkQuestionGroups = rawQuestionGroups as RawQuestionGroups;

export function upkkQuestionItemKey(componentKey: string, itemNumber: string) {
  return `${componentKey}_${itemNumber}`.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function upkkQuestionGroupsByComponent(componentKey: string) {
  return upkkQuestionGroups[componentKey] ?? [];
}

export function upkkScorableQuestionsByComponent(componentKey: string): UpkkScorableQuestion[] {
  const component = upkkJakimComponents.find((item) => item.key === componentKey);
  if (!component) return [];

  return upkkQuestionGroupsByComponent(componentKey).map((group) => {
    const helper = group.items
      .filter((item) => item.number !== group.number || item.title !== group.title)
      .map((item) => `${item.number} ${item.title} (${formatQuestionMark(item.maxMark)})`)
      .join('; ');

    return {
      key: upkkQuestionItemKey(component.key, group.number),
      componentKey: component.key,
      componentTitle: `${component.section}: ${component.title}`,
      assessmentType: component.assessmentType,
      section: component.section,
      number: group.number,
      title: group.title,
      maxMark: group.maxMark,
      helper,
    };
  });
}

export function upkkScorableQuestionsByType(type: UpkkJakimAssessmentType): UpkkScorableQuestion[] {
  return upkkComponentsByType(type).flatMap((component) => upkkScorableQuestionsByComponent(component.key));
}

function formatQuestionMark(value: number) {
  return Number.isInteger(value) ? `${value}m` : `${value.toFixed(1)}m`;
}
