import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Project } from "../types/kanban";

export default function ProjectsIndex() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectKey, setNewProjectKey] = useState("");
  const [newProjectRepoUrl, setNewProjectRepoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectRepoUrl.trim()) return;

    try {
      const response = await fetch("http://localhost:3001/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          repoUrl: newProjectRepoUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to create project");

      const newProject = await response.json();
      setProjects([...projects, newProject]);
      setNewProjectName("");
      setNewProjectRepoUrl("");
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isCreating && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., My Awesome Project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository URL
                </label>
                <input
                  type="url"
                  value={newProjectRepoUrl}
                  onChange={(e) => setNewProjectRepoUrl(e.target.value)}
                  placeholder="e.g., https://github.com/username/repo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The Git repository URL for this project
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName("");
                    setNewProjectRepoUrl("");
                    setError(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first project to get started
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}/board`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {project.name}
                  </h3>
                </div>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {project.description}
                  </p>
                )}
                <div className="text-sm text-gray-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
