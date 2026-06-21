import { pgTable, text, serial, timestamp, integer, real, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";

export const courseLevelEnum = pgEnum("course_level", ["iniciante", "intermediario", "avancado", "especialista"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "pdf", "texto", "quiz", "link", "arquivo"]);
export const courseStatusEnum = pgEnum("course_status", ["rascunho", "publicado", "arquivado"]);

export const academyCategoriesTable = pgTable("academy_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull().default("📚"),
  color: text("color").notNull().default("#3b82f6"),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const academyCoursesTable = pgTable("academy_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug"),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  specialty: text("specialty").notNull(),
  category: text("category").notNull().default("Geral"),
  categoryId: integer("category_id").references(() => academyCategoriesTable.id, { onDelete: "set null" }),
  level: courseLevelEnum("level").notNull().default("iniciante"),
  duration: integer("duration").notNull().default(0),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  content: text("content").notNull().default(""),
  instructor: text("instructor"),
  tags: text("tags"),
  published: boolean("published").notNull().default(true),
  status: courseStatusEnum("status").notNull().default("publicado"),
  enrollments: integer("enrollments").notNull().default(0),
  rating: real("rating"),
  pointsValue: integer("points_value").notNull().default(50),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const academyModulesTable = pgTable("academy_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const academyLessonsTable = pgTable("academy_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => academyModulesTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: lessonTypeEnum("type").notNull().default("video"),
  duration: integer("duration").notNull().default(0),
  videoUrl: text("video_url"),
  content: text("content"),
  materialUrl: text("material_url"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const academyQuizQuestionsTable = pgTable("academy_quiz_questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => academyLessonsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").notNull().default("[]"),
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").notNull().default(10),
  timeLimitSeconds: integer("time_limit_seconds").notNull().default(60),
  order: integer("order").notNull().default(0),
});

export const academyLessonProgressTable = pgTable("academy_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => academyLessonsTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  score: integer("score"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const academyCertificateTemplatesTable = pgTable("academy_certificate_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  backgroundUrl: text("background_url"),
  signatureUrl: text("signature_url"),
  logoUrl: text("logo_url"),
  validityDays: integer("validity_days"),
  textTemplate: text("text_template"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const academyEnrollmentsTable = pgTable("academy_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const academyCertificatesTable = pgTable("academy_certificates", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  hash: text("hash").notNull().unique(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const insertAcademyCourseSchema = createInsertSchema(academyCoursesTable).omit({ id: true, createdAt: true, updatedAt: true, enrollments: true });
export type AcademyCourse = typeof academyCoursesTable.$inferSelect;
export type AcademyCertificate = typeof academyCertificatesTable.$inferSelect;
export type AcademyModule = typeof academyModulesTable.$inferSelect;
export type AcademyLesson = typeof academyLessonsTable.$inferSelect;
export type AcademyCategory = typeof academyCategoriesTable.$inferSelect;
