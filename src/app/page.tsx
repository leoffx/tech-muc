"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./_components/ui/card";
import { Button } from "./_components/ui/button";
import { Input } from "./_components/ui/input";
import { Label } from "./_components/ui/label";
import { Modal } from "./_components/ui/modal";
import { Skeleton } from "./_components/ui/skeleton";

export default function Home() {
  const projects = useQuery(api.projects.list);
  const createProject = useMutation(api.projects.create);

  const [title, setTitle] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedUrl = githubRepoUrl.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setError("Please provide both a project title and a GitHub repository URL.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createProject({
        title: trimmedTitle,
        githubRepoUrl: trimmedUrl,
      });
      setTitle("");
      setGithubRepoUrl("");
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasProjects = (projects?.length ?? 0) > 0;
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }
    setIsModalOpen(open);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Tech MUC Projects</h1>
          <p className="max-w-2xl text-muted-foreground">
            Browse community-built projects and jump straight into their GitHub repositories. Ready to share?
            Publish yours and inspire the next contributor.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          Create a project
        </Button>
      </section>

      <section className="grid gap-6">
        {projects === undefined ? (
          <ProjectsSkeleton />
        ) : hasProjects ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project._id} className="flex h-full flex-col justify-between transition hover:shadow-md">
                <CardHeader className="space-y-2">
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription className="truncate">
                    <a
                      href={project.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-foreground underline hover:text-primary"
                    >
                      {project.githubRepoUrl}
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link
                    href={`/projects/${project._id}`}
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Open kanban
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                Share your work with the community by adding your first project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsModalOpen(true)}>Create a project</Button>
            </CardContent>
          </Card>
        )}
      </section>

      <Modal
        open={isModalOpen}
        onOpenChange={handleOpenChange}
        title="Create a project"
        description="Share the project name and its GitHub repository so others can explore it."
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 text-left">
            <Label htmlFor="project-title">Project title</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Tech MUC Website"
              maxLength={120}
              required
            />
          </div>
          <div className="grid gap-2 text-left">
            <Label htmlFor="github-url">GitHub repository URL</Label>
            <Input
              id="github-url"
              type="url"
              value={githubRepoUrl}
              onChange={(event) => setGithubRepoUrl(event.target.value)}
              placeholder="https://github.com/tech-muc/website"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create project"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="flex h-full flex-col justify-between">
          <CardHeader className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardFooter>
            <Skeleton className="h-10 w-full rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
