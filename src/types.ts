export enum Type {
  TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
  NULL = "NULL",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export interface Domain {
  id: string;
  name: string;
}

export interface DetailedInterpretation {
  essence: string;
  interference: string;
  growthPoint: string;
}

export interface Schema {
  id: string;
  domainId: string;
  name: string;
  code: string;
  description: string;
  detailedInterpretation: DetailedInterpretation;
}

export interface Question {
  id: number;
  schemaId: string;
  textMale: string;
  textFemale: string;
}

export interface SchemaResult {
  schemaId: string;
  schemaName: string;
  domainName: string;
  averageScore: number;
  isSignificant: boolean;
  interpretation: DetailedInterpretation;
}
