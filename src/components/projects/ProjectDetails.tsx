import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Presentation } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectFile } from "@/types/project";
import { ProjectHypothesis } from "./details/ProjectHypothesis";
import { ProjectMaterials } from "./details/ProjectMaterials";
import { ProjectFiles } from "./details/ProjectFiles";
import { ProjectNotes } from "./details/ProjectNotes";
import { ProjectAnalysis } from "./details/ProjectAnalysis";

interface ProjectDetailsProps {
  project: Project | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPresentationMode: () => void;
}

export const ProjectDetails = ({
  project,
  isOpen,
  onOpenChange,
  onPresentationMode,
}: ProjectDetailsProps) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (project?.id) {
      fetchFiles();
    }
  }, [project?.id]);

  const fetchFiles = async () => {
    if (!project?.id) return;

    const { data, error } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching files",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setFiles(data);
  };

  const exportProject = () => {
    if (!project) return;

    const projectData = {
      ...project,
      files: files,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, "-")}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Project exported",
      description: "Your project data has been exported successfully."
    });
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
          <DialogDescription>{project.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)] pr-4 -mr-4">
          <ProjectAnalysis
            projectId={project.id}
            title={project.title}
            description={project.description}
            hypothesis={project.hypothesis}
            materials={project.materials}
          />
          <ProjectHypothesis hypothesis={project.hypothesis} />
          <ProjectMaterials materials={project.materials} />
          <ProjectFiles
            projectId={project.id}
            files={files}
            onFileUploaded={fetchFiles}
          />
          <ProjectNotes
            projectId={project.id}
            notes={project.observation_notes || []}
          />

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 border-t">
            <Button variant="outline" onClick={exportProject}>
              <Download className="h-4 w-4 mr-2" />
              Export Project
            </Button>
            <Button variant="outline" onClick={onPresentationMode}>
              <Presentation className="h-4 w-4 mr-2" />
              Present Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
