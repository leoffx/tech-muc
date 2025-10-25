import { useParams } from 'react-router';
import { BoardProvider } from '../contexts/BoardContext';
import { BoardPage } from '../components/BoardPage';

export default function ProjectBoardRoute() {
  const { projectId } = useParams();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Project ID is required</div>
      </div>
    );
  }

  return (
    <BoardProvider>
      <BoardPage projectId={projectId} />
    </BoardProvider>
  );
}
