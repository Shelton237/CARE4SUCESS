export const ROUTE_PATHS = {
  HOME: "/",
  SERVICES: "/services",
  NIVEAUX: "/niveaux",
  PROFESSEURS: "/professeurs",
  CONTACT: "/contact",
  DEVENIR_PROFESSEUR: "/devenir-professeur",
} as const;

export interface Teacher {
  id: string;
  name: string;
  photo: string;
  subjects: string[];
  levels: string[];
  experience: number;
  rating: number;
  bio: string;
  qualifications: string[];
}

export interface Course {
  id: string;
  title: string;
  subject: string;
  level: string;
  duration: number;
  price: number;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  photo: string;
  rating: number;
  text: string;
  level: string;
  subject: string;
  date: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  price: string;
  image: string;
  benefits: string[];
}

export interface Level {
  id: string;
  name: string;
  description: string;
  grades: string[];
  subjects: string[];
  image: string;
  keyPoints: string[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  levels: string[];
  icon: string;
  popular: boolean;
}
