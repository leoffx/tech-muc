import { simpleGit, type SimpleGit } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger.js';

const WORK_DIR = process.env.WORK_DIR || '/tmp/tech-muc-repos';

export interface RepoInfo {
  path: string;
  url: string;
}

class GitService {
  private repoCache = new Map<string, RepoInfo>();

  constructor() {
    this.ensureWorkDir();
  }

  private ensureWorkDir(): void {
    if (!fs.existsSync(WORK_DIR)) {
      fs.mkdirSync(WORK_DIR, { recursive: true });
      logger.info({ workDir: WORK_DIR }, 'Created work directory');
    }
  }

  private getRepoPath(repoUrl: string): string {
    const repoName = repoUrl
      .replace(/\.git$/, '')
      .split('/')
      .pop() || 'repo';
    return path.join(WORK_DIR, repoName);
  }

  async cloneOrPullRepo(repoUrl: string): Promise<string> {
    const cached = this.repoCache.get(repoUrl);
    if (cached && fs.existsSync(cached.path)) {
      logger.info({ repoUrl, path: cached.path }, 'Using cached repository');
      
      try {
        const git: SimpleGit = simpleGit(cached.path);
        await git.pull();
        logger.info({ repoUrl, path: cached.path }, 'Pulled latest changes');
      } catch (error) {
        logger.warn({ repoUrl, path: cached.path, error }, 'Pull failed, using existing repo');
      }
      
      return cached.path;
    }

    const repoPath = this.getRepoPath(repoUrl);

    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }

    logger.info({ repoUrl, path: repoPath }, 'Cloning repository');
    
    const git: SimpleGit = simpleGit();
    await git.clone(repoUrl, repoPath, ['--depth', '1']);
    
    const repoInfo: RepoInfo = { path: repoPath, url: repoUrl };
    this.repoCache.set(repoUrl, repoInfo);
    
    logger.info({ repoUrl, path: repoPath }, 'Repository cloned successfully');
    
    return repoPath;
  }

  async getRepoStructure(repoPath: string): Promise<string> {
    const files: string[] = [];
    
    const walkDir = (dir: string, prefix: string = ''): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        const relativePath = path.join(prefix, entry.name);
        
        if (entry.isDirectory()) {
          files.push(`${relativePath}/`);
          walkDir(path.join(dir, entry.name), relativePath);
        } else {
          files.push(relativePath);
        }
      }
    };
    
    walkDir(repoPath);
    return files.join('\n');
  }

  cleanup(repoUrl: string): void {
    const cached = this.repoCache.get(repoUrl);
    if (cached && fs.existsSync(cached.path)) {
      fs.rmSync(cached.path, { recursive: true, force: true });
      this.repoCache.delete(repoUrl);
      logger.info({ repoUrl, path: cached.path }, 'Repository cleaned up');
    }
  }
}

export const gitService = new GitService();
