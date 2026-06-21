import { pgTable, text, serial, timestamp, integer, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";

export const courseLevelEnum = pgEnum("course_level", ["iniciante", "intermediario", "avancado", "especialista"]);

export const academyCoursesTable = pgTable("academy_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  specialty: text("specialty").notNull(),
  category: text("category").notNull().default("Geral"),
  level: courseLevelEnum("level").notNull().default("iniciante"),
  duration: integer("duration").notNull().default(0),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  content: text("content").notNull().default(""),
  published: boolean("published").notNull().default(true),
  enrollments: integer("enrollments").notNull().default(0),
  rating: real("rating"),
  pointsValue: integer("points_value").notNull().default(50),
  isMandatory: boolean("is_mandatory").notNull().default(false),
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

export const insertAcademyCourseSchema = createInsertSchema(academyCoursesTable).omit({ id: true, createdAt: true, enrollments: true });
export type AcademyCourse = typeof academyCoursesTable.$inferSelect;
export type AcademyCertificate = typeof academyCertificatesTable.$inferSelect;
