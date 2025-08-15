'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, isAuthenticated, logout } from '../../utils/api';

interface Project {
  id: number;
  name: string;
  role: string;
  isOwner: boolean;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin');
      return;
    }

    const fetchData = async () => {
      try {
        const [projectsData, userData] = await Promise.all([
          api.getAllProjects(),
          api.getUserPermissions()
        ]);
        
        setProjects(projectsData.projects || []);
        setUserInfo(userData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (error instanceof Error && error.message.includes('Authentication expired')) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCreateProject = () => {
    router.push('/editor');
  };

  const handleOpenProject = (projectId: number) => {
    router.push(`/editor/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">NotE Dashboard</h1>
            <div className="flex items-center space-x-4">
              {userInfo && (
                <span className="text-sm text-gray-600">
                  Welcome, {userInfo.name || userInfo.email}
                </span>
              )}
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
            <button
              onClick={handleCreateProject}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first project.</p>
              <button
                onClick={handleCreateProject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.isOwner 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
