import { db } from '../db/client';
import { projects } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  createdAt: Date;
}

export const projectService = {
  async create(name: string, repoUrl: string): Promise<Project> {
    const [project] = await db.insert(projects).values({
      name,
      githubUrl: repoUrl,
    }).returning();
    
    return {
      id: project.id,
      name: project.name,
      repoUrl: project.githubUrl,
      createdAt: project.createdAt,
    };
  },

  async findById(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    
    if (!project) return undefined;
    
    return {
      id: project.id,
      name: project.name,
      repoUrl: project.githubUrl,
      createdAt: project.createdAt,
    };
  },

  async findAll(): Promise<Project[]> {
    const result = await db.select().from(projects);
    
    return result.map(project => ({
      id: project.id,
      name: project.name,
      repoUrl: project.githubUrl,
      createdAt: project.createdAt,
    }));
  },
};
