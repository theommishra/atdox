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
    const router = useRouter();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
                
                if (!token) {
                    console.log('No token found, redirecting to home');
                    router.push('/');
                    return;
                }

                console.log('Fetching projects with token:', token);
                const response = await fetch('http://localhost:3002/allprojects', {
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
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
            
            if (!token) {
                console.error('No token found');
                router.push('/');
                return;
            }

            console.log('Attempting to delete project:', projectId);
            console.log('Using token:', token);

            const response = await fetch(`http://localhost:3002/deleteproject?id=${projectId}`, {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
                    <button
                        onClick={() => router.push('/editor')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        New Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                        <p className="mt-2 text-gray-500">Create your first project to get started!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative group"
                            >
                                <div 
                                    onClick={() => router.push(`/editor?id=${project.id}`)}
                                    className="cursor-pointer"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                                    <div className="text-sm text-gray-500">
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