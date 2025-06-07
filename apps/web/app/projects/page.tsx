"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const router = useRouter();

    const generateUniqueProjectName = (baseName: string): string => {
        const existingNames = new Set(projects.map(p => p.name));
        let newName = baseName;
        let counter = 1;

        while (existingNames.has(newName)) {
            newName = `${baseName} (${counter})`;
            counter++;
        }

        return newName;
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
                const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
                
                if (!token) {
                    console.log('No token found, redirecting to home');
                    router.push('/');
                    return;
                }

                console.log('Fetching projects with token:', token);
                const response = await fetch(`${backendUrl}/allprojects`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });

                console.log('Response status:', response.status);
                const contentType = response.headers.get('content-type');
                console.log('Content-Type:', contentType);

                if (response.status === 401) {
                    console.log('Unauthorized, redirecting to home');
                    router.push('/');
                    return;
                }

                if (!response.ok) {
                    const text = await response.text();
                    console.error('Error response:', text);
                    throw new Error('Failed to fetch projects');
                }

                const data = await response.json();
                console.log('Received data:', data);
                
                if (data.projects) {
                    setProjects(data.projects);
                } else {
                    setProjects([]);
                }
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError(err instanceof Error ? err.message : 'Failed to load projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [router]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('Are you sure you want to delete this project?')) {
            return;
        }

        setIsDeleting(projectId);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
            
            if (!token) {
                console.error('No token found');
                router.push('/');
                return;
            }

            console.log('Attempting to delete project:', projectId);
            console.log('Using token:', token);

            const response = await fetch(`${backendUrl}/deleteproject?id=${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            console.log('Delete response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete project');
            }

            // Remove the deleted project from the state
            setProjects(prev => prev.filter(project => project.id !== projectId));
            console.log('Project removed from state');
        } catch (err) {
            console.error('Error deleting project:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            return;
        }

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
            
            if (!token) {
                console.error('No token found');
                router.push('/');
                return;
            }

            const uniqueName = generateUniqueProjectName(newProjectName.trim());

            const response = await fetch(`${backendUrl}/createProject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    tittle: uniqueName,
                    data: '<p>Start writing your content here...</p>'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create project');
            }

            const data = await response.json();
            if (data.fileId) {
                router.push(`/editor?id=${data.fileId}`);
            }
        } catch (err) {
            console.error('Error creating project:', err);
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setIsDialogOpen(false);
            setNewProjectName('');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Projects</h1>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        New Project
                    </button>
                </div>

                {isDialogOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Project</h2>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project name"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        setNewProjectName('');
                                    }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {projects.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No projects yet</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Create your first project to get started!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative group"
                            >
                                <div 
                                    onClick={() => router.push(`/editor?id=${project.id}`)}
                                    className="cursor-pointer"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        <p>Created: {formatDate(project.createdAt)}</p>
                                        <p>Last updated: {formatDate(project.updatedAt)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(project.id);
                                    }}
                                    disabled={isDeleting === project.id}
                                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete project"
                                >
                                    {isDeleting === project.id ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}