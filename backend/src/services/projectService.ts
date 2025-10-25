import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  createdAt: Date;
}

const projects = new Map<string, Project>();

export const projectService = {
  create(name: string, repoUrl: string): Project {
    const project: Project = {
      id: uuidv4(),
      name,
      repoUrl,
      createdAt: new Date(),
    };
    projects.set(project.id, project);
    return project;
  },

  findById(id: string): Project | undefined {
    return projects.get(id);
  },

  findAll(): Project[] {
    return Array.from(projects.values());
  },
};
